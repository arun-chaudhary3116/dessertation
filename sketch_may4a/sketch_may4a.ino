#include <WiFiS3.h>
#include "DHT.h"

char ssid[] = "HUAWEI MatePad";
char pass[] = "123456789@@";

char server[] = "192.168.43.206";
int port = 5000;

#define DHTPIN 2
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

#define MQ2PIN A0

WiFiClient client;
int status = WL_IDLE_STATUS;

void setup() {
  Serial.begin(9600);
  delay(2000);

  dht.begin();

  Serial.println("Starting WiFi...");

  while (status != WL_CONNECTED) {
    status = WiFi.begin(ssid, pass);
    Serial.println("Connecting to WiFi...");
    delay(3000);
  }

  Serial.println("WiFi connected!");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());
}

void loop() {

  // ---------------- IMPORTANT DELAY ----------------
  delay(2000);

  // ---------------- SENSOR READ ----------------
  float humidity = dht.readHumidity();
  float temperature = dht.readTemperature();
  int gasValue = analogRead(MQ2PIN);

  // ---------------- SENSOR VALIDATION ----------------
  if (isnan(humidity) || isnan(temperature)) {
    Serial.println("DHT sensor failed reading. Retrying...");
    delay(2000);
    return;
  }

  // ---------------- SERIAL OUTPUT ----------------
  Serial.println("------ Sensor Data ------");
  Serial.print("Temperature: ");
  Serial.println(temperature);
  Serial.print("Humidity: ");
  Serial.println(humidity);
  Serial.print("Gas Value: ");
  Serial.println(gasValue);

  // ---------------- CONNECT TO FLASK ----------------
  if (client.connect(server, port)) {

    String json = "{";
    json += "\"temperature\":" + String(temperature, 2) + ",";
    json += "\"humidity\":" + String(humidity, 2) + ",";
    json += "\"gas_value\":" + String(gasValue);
    json += "}";

    client.println("POST /data HTTP/1.1");
    client.print("Host: ");
    client.println(server);
    client.println("Content-Type: application/json");
    client.println("Connection: close");
    client.print("Content-Length: ");
    client.println(json.length());
    client.println();
    client.println(json);

    Serial.println("Data sent successfully!");
    Serial.println(json);

  } else {
    Serial.println("Server connection failed");
  }

  client.stop();

  // ---------------- STABLE DELAY ----------------
  delay(15000);
}