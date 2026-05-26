# Sensor Data Backend API

A Flask-based REST API for sensor data collection, storage, and predictive analytics with automated alerting capabilities.

## Features

- **Sensor Data Collection**: POST endpoint for receiving real-time sensor data (temperature, humidity, gas levels)
- **Data Retrieval**: GET endpoint for accessing the last 100 sensor records
- **Predictive Analytics**: ML-powered trend analysis and future predictions using Linear Regression
- **Email Alerts**: Automated threshold-based email notifications
- **Database Storage**: MySQL integration for persistent data storage

## Prerequisites

- Python 3.8 or higher
- MySQL Server 5.7 or higher
- pip package manager

## Installation

### 1. Clone or Setup the Project

```bash
cd python
```

### 2. Create Virtual Environment

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

If `requirements.txt` doesn't exist, install manually:

```bash
pip install flask flask-cors mysql-connector-python pandas scikit-learn
```

### 4. Database Setup

Create a MySQL database:

```sql
CREATE DATABASE sensor_db;

USE sensor_db;

CREATE TABLE sensor_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    temperature FLOAT NOT NULL,
    humidity FLOAT NOT NULL,
    gas_value INT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 5. Configuration

Update the database credentials in `app.py`:

```python
DB_CONFIG = {
    "host": "localhost",        # MySQL host
    "user": "root",             # MySQL username
    "password": "your_password", # MySQL password
    "database": "sensor_db"     # Database name
}
```

For email alerts, update Gmail credentials:

```python
EMAIL_USER = "your_email@gmail.com"
EMAIL_PASS = "your_app_password"  # Use Gmail App Password, not regular password
```

**Note**: Generate a Gmail App Password by:

1. Go to https://myaccount.google.com/security
2. Enable 2-Step Verification
3. Navigate to App passwords
4. Generate and copy the 16-character password

## Running the Application

### Development Mode

```bash
python app.py
```

The API will be available at `http://localhost:5000`

### Production Mode (Optional)

For production deployment, use a WSGI server like Gunicorn:

```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

## API Endpoints

### 1. Health Check

- **Endpoint**: `GET /health`
- **Response**: `{"ok": true}`

### 2. Receive Sensor Data

- **Endpoint**: `POST /data`
- **Body**:

```json
{
  "temperature": 25.5,
  "humidity": 65.0,
  "gas_value": 150
}
```

- **Response**: `{"status": "success"}`

### 3. Get Sensor Data

- **Endpoint**: `GET /data`
- **Response**: Array of last 100 records with temperature, humidity, gas, and timestamp

### 4. Get Predictions

- **Endpoint**: `GET /predict`
- **Response**:

```json
{
    "current": {
        "temperature": 25.50,
        "humidity": 65.00
    },
    "trend": "stable",
    "actual_data": [...],
    "future_predictions": [...]
}
```

## Alert Thresholds

Automated email alerts are triggered for:

- **High Temperature**: > 30°C
- **Low Temperature**: < 10°C
- **High Humidity**: > 70%
- **High Gas**: > 300

## Troubleshooting

**Database Connection Error**

- Verify MySQL is running
- Check credentials in `DB_CONFIG`
- Ensure `sensor_db` database exists

**Email Not Sending**

- Verify Gmail credentials and App Password
- Check that 2-Step Verification is enabled
- Verify the recipient email address

**CORS Issues**

- CORS is enabled by default for all origins
- Modify if deploying to production: `CORS(app, resources={r"/api/*": {"origins": "allowed-domain.com"}})`

## Project Structure

```
python/
├── app.py           # Main Flask application
├── README.md        # This file
└── requirements.txt # Python dependencies
```

## Dependencies

- **Flask**: Web framework
- **Flask-CORS**: Cross-Origin Resource Sharing support
- **mysql-connector-python**: MySQL database driver
- **pandas**: Data manipulation and analysis
- **scikit-learn**: Machine learning predictions

## License

This project is part of a dissertation project.

## Support

For issues or questions, please refer to the main project documentation or contact the maintainers.
