int pins[5] = {A0, A1, A2, A3, A4};
int initReadings[5] = {0, 0, 0, 0, 0};
int scores[5] = {0, 0, 0, 0, 0};
int letterToScoreMapping[26] = {}; 


// 0 is straight finger, 0.5 is half bent, and 1 is fully bent
void setup() {
  Serial.begin(9600); 
  
  for (int i = 0; i < 5; i++) {
    initReadings[i] = analogRead(pins[i]); 
  }
}

int calcFingers() {
   for (int i = 0; i < 5; i++) {
    int currentReading = analogRead(pins[i]);
    if (currentReading - initReadings[i] > 5) {
      scores[i] = 0.5;
    }
    if (currentReading - initReadings[i] > 10){
      scores[i] = 1;
    }
  }
} 

int orientation(){
  // code for orientation
}

void loop() {
  calcFingers();
}
