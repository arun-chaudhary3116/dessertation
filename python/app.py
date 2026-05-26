from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
import pandas as pd
from sklearn.linear_model import LinearRegression

import smtplib
from email.mime.text import MIMEText

app = Flask(__name__)
CORS(app)

# ---------------- DB CONFIG ----------------
DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "Password1234567890",
    "database": "sensor_db"
}

def get_db():
    return mysql.connector.connect(**DB_CONFIG)

# ---------------- EMAIL CONFIG ----------------
EMAIL_USER = "arunc3116@gmail.com"
EMAIL_PASS = "lima yzvz imcy iuyc"   # <-- paste your app password here (DO NOT share it)

def send_email(subject, message):
    msg = MIMEText(message)
    msg["Subject"] = subject
    msg["From"] = EMAIL_USER
    msg["To"] = "arunc3116@gmail.com"

    try:
        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login(EMAIL_USER, EMAIL_PASS)
        server.sendmail(EMAIL_USER, msg["To"], msg.as_string())
        server.quit()
        print("Email sent successfully")
    except Exception as e:
        print("Email error:", e)

# ---------------- POST DATA ----------------
@app.route("/data", methods=["POST"])
def receive_data():
    data = request.get_json(force=True, silent=True) or {}

    try:
        temperature = float(data["temperature"])
        humidity = float(data["humidity"])
        gas_value = int(data["gas_value"])
    except (KeyError, ValueError, TypeError):
        return jsonify({"status": "error", "message": "invalid payload"}), 400

    # ---------------- SAVE TO DB ----------------
    db = get_db()
    cur = db.cursor()

    cur.execute(
        "INSERT INTO sensor_data (temperature, humidity, gas_value) VALUES (%s, %s, %s)",
        (temperature, humidity, gas_value),
    )

    db.commit()
    cur.close()
    db.close()

    # ---------------- EMAIL ALERT LOGIC ----------------
    if temperature > 30:
        send_email(
            "🔥 High Temperature Alert",
            f"Temperature is {temperature}°C"
        )

    if temperature < 10:
        send_email(
            "❄ Low Temperature Alert",
            f"Temperature is {temperature}°C"
        )

    if humidity > 70:
        send_email(
            "💧 High Humidity Alert",
            f"Humidity is {humidity}%"
        )

    if gas_value > 300:
        send_email(
            "🚨 Gas Alert",
            f"Gas level is {gas_value}"
        )

    return jsonify({"status": "success"}), 200


# ---------------- GET DATA ----------------
@app.route("/data", methods=["GET"])
def get_data():
    db = get_db()
    cur = db.cursor(dictionary=True)

    cur.execute(
        "SELECT id, temperature, humidity, gas_value AS gas, timestamp "
        "FROM sensor_data ORDER BY id DESC LIMIT 100"
    )

    rows = cur.fetchall()

    for r in rows:
        r["timestamp"] = r["timestamp"].isoformat() if r["timestamp"] else None

    cur.close()
    db.close()

    return jsonify(rows)


# ---------------- ML DATA ----------------
def get_sensor_data_for_ml():
    db = get_db()
    cur = db.cursor(dictionary=True)

    cur.execute(
        "SELECT temperature, humidity, gas_value, timestamp FROM sensor_data ORDER BY timestamp ASC"
    )

    rows = cur.fetchall()

    cur.close()
    db.close()

    return rows


# ---------------- PREDICTION ----------------
@app.route("/predict", methods=["GET"])
def predict():
    data = get_sensor_data_for_ml()

    if len(data) < 5:
        return jsonify({
            "current": {"temperature": 0, "humidity": 0},
            "trend": "stable",
            "actual_data": [],
            "future_predictions": []
        }), 200

    df = pd.DataFrame(data)

    df["timestamp"] = pd.to_datetime(df["timestamp"])
    df["time_index"] = df["timestamp"].astype("int64") // 10**9

    X = df[["time_index"]]

    # Temperature model
    model_temp = LinearRegression()
    model_temp.fit(X, df["temperature"])

    # Humidity model
    model_hum = LinearRegression()
    model_hum.fit(X, df["humidity"])

    # Get current values
    current_temp = float(df["temperature"].iloc[-1])
    current_hum = float(df["humidity"].iloc[-1])

    # Determine trend
    if len(df) >= 2:
        temp_diff = df["temperature"].iloc[-1] - df["temperature"].iloc[-2]
        trend = "increasing" if temp_diff > 0.5 else "decreasing" if temp_diff < -0.5 else "stable"
    else:
        trend = "stable"

    # Generate actual data for frontend (last 10 records)
    actual_data = []
    for _, row in df.tail(10).iterrows():
        actual_data.append({
            "timestamp": row["timestamp"].isoformat(),
            "temperature": float(row["temperature"]),
            "humidity": float(row["humidity"])
        })

    # Generate future predictions (next 5 steps, 60 seconds apart)
    future_predictions = []
    last_time = df["time_index"].iloc[-1]
    for step in range(1, 6):
        next_time = last_time + (60 * step)
        X_pred = pd.DataFrame({"time_index": [next_time]})
        pred_temp = float(model_temp.predict(X_pred)[0])
        pred_hum = float(model_hum.predict(X_pred)[0])
        future_predictions.append({
            "step": step,
            "predicted_temperature": round(pred_temp, 2),
            "predicted_humidity": round(pred_hum, 2)
        })

    return jsonify({
        "current": {
            "temperature": round(current_temp, 2),
            "humidity": round(current_hum, 2)
        },
        "trend": trend,
        "actual_data": actual_data,
        "future_predictions": future_predictions
    })


# ---------------- HEALTH ----------------
@app.route("/health", methods=["GET"])
def health():
    return jsonify({"ok": True})


# ---------------- RUN ----------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)