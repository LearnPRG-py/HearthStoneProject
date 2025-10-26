int pins[5] = {A0, A1, A2, A3, A4};
int initReadings[5] = {0, 0, 0, 0, 0};
int scores[5] = {0, 0, 0, 0, 0};
int letterToScoreMapping[26] = {}; 

void setup() {
  Serial.begin(9600); 
  for (int i = 0; i < 5; i++) initReadings[i] = analogRead(pins[i]); 
}

int calcFingers() {
   for (int i = 0; i < 5; i++) {
    int currentReading = analogRead(pins[i]);
    scores[i] = (min(floor((currentReading - initReadings[i])/5), 2))/2;
  }
} 

int orientation(){
  // code for orientation
}

void loop() {
  calcFingers();
}
