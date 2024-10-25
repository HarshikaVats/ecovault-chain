/* Sensors included: Nodemcu, Touch Pad, RFID sensor, LCD
For TouchPad:
  Out1 -> A0
  Vcc  -> 3.3V
  
For RFID Sensor:
  SDA  -> D8
  SCK  -> D5
  MOSI -> D7
  MISO -> D6
  RST  -> D0
  
For LCD:
  Vcc -> Vin
  SDA -> D2
  SCL -> D1
*/

#include <SPI.h>
#include <Wire.h>
#include <MFRC522.h>
#include <ESP8266WiFi.h>
#include <WiFiClientSecure.h>
#include <LiquidCrystal_I2C.h>

const char* ssid = "VATS";
const int httpsPort = 443;
const char* password = "******";

// credentials for the db interaction
const char* host = "squarehub.glitch.me";

LiquidCrystal_I2C lcd(0x27, 16, 2);

#define SS_PIN D8
#define RST_PIN D0
MFRC522 rfid(SS_PIN, RST_PIN);  // Instance of the class
MFRC522::MIFARE_Key key;
// Init array that will store new NUID
byte nuidPICC[4];

String callBackend(String endpoint) {
  lcd.setCursor(0,0);
  lcd.print("   FETCHING..       ");
  Serial.println("CALLING THE BACKEND FUNCTION");
  WiFiClientSecure httpsClient;
  httpsClient.setInsecure();
  httpsClient.setTimeout(15000);
  delay(800);
  
  while((!httpsClient.connect(host, httpsPort))){
    delay(100);
  }

  String url = endpoint;
  Serial.println("URL IS: "+url);
  httpsClient.print(String("GET ") + url + " HTTP/1.1\r\n" + "Host: " + host + "\r\n" + "Connection: close\r\n\r\n");

  String line = "";
  while (httpsClient.connected()) {
    line = httpsClient.readStringUntil('\n');
    Serial.println(line);
    if (line == "\r") {
      break;
    }
  }

  String response;
  while(httpsClient.available()){        
    response = httpsClient.readStringUntil('\n');
  }

  return response;
}

void setup() {
  Serial.begin(115200);

  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) 
  {
    delay(500);
  }

  Serial.println("Wifi Connected");
  Serial.println("Calling the function");

  lcd.begin();
  lcd.backlight();
  lcd.clear();
  lcd.setCursor(0, 1);
  lcd.print("   SQUARE HUB");

  pinMode(A0, INPUT);

  SPI.begin();      
  rfid.PCD_Init();  
  Serial.println();
  Serial.print("Reader :");
  rfid.PCD_DumpVersionToSerial();
  for (byte i = 0; i < 6; i++) {
    key.keyByte[i] = 0xFF;
  }
  Serial.println();
  Serial.println("This code scan the MIFARE Classic NUID.");
  Serial.print("Using the following key:");
}

void loop() {
  // Reset the loop if no new card present on the sensor/reader. This saves the entire process when idle.
  if (!rfid.PICC_IsNewCardPresent()) {
    return;
  }

  // Select one of the cards
  if (!rfid.PICC_ReadCardSerial()) {
    return;
  }

  // Dump debug info about the card; PICC_HaltA() is automatically called
  // rfid.PICC_DumpToSerial(&(rfid.uid));
  Serial.println();
  Serial.print("UID tag :");
  
  String content = "";
  byte letter;

  for (byte i = 0; i < rfid.uid.size; i++) {
    Serial.print(rfid.uid.uidByte[i] < 0x10 ? " 0" : " ");
    Serial.print(rfid.uid.uidByte[i], HEX);
    content.concat(String(rfid.uid.uidByte[i] < 0x10 ? " 0" : " "));
    content.concat(String(rfid.uid.uidByte[i], HEX));
  }
  content.toUpperCase();

  int keyValue = analogRead(A0);
  Serial.println("Analog Values is: " + keyValue );

  if(content.substring(1) == "6A A5 FF B0") { 
    
    if(keyValue > 1000) {
      String res = callBackend("/processPayment?tag=6A%20A5%20FF%20B0");
      Serial.println("Key1 result is: " + res);
      lcd.setCursor(1, 0);
      lcd.print(res);
    } else {
      String result = callBackend("/checkOrder?tag=6A%20A5%20FF%20B0");
      Serial.println("Result is: " + result);
      lcd.home();
      lcd.setCursor(1, 0);
      lcd.print(result);
    }
  }
  else if(content.substring(1) == "63 9A 54 AC") {
    if(keyValue > 1000) {
      String res = callBackend("/processPayment?tag=63%209A%2054%20AC");
      Serial.println("Key1 result is: " + res);
      lcd.setCursor(1, 0);
      lcd.print(res);
    } else {
      String result = callBackend("/checkOrder?tag=63%209A%2054%20AC");
      Serial.println("Result is: " + result);
      lcd.home();
      lcd.setCursor(1, 0);
      lcd.print(result);
    }
  }

  Serial.println(content.substring(1));
  delay(1000);
}
