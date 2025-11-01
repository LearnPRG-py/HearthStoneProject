int pins[5] = {A0, A1, A2, A3, A4}; // thumb, index, middle, ring, pinky
int initReadings[5] = {0, 0, 0, 0, 0};
float scores[5] = {0, 0, 0, 0, 0};

// 0 = straight, 0.5 = half bent, 1 = fully bent
float aslLetters[26][5] = {
  {0.5, 1, 1, 1, 1},  // A
  {0, 0, 0, 0, 0},    // B (all straight)
  {0.5, 0.5, 0.5, 0.5, 0.5},  // C (curved)
  {1, 0, 1, 1, 1},    // D (index up)
  {1, 1, 1, 1, 1},    // E (all curled)
  {0.5, 0.5, 1, 1, 1},// F (O shape)
  {0.5, 0, 0, 1, 1},  // G (thumb+index extended sideways)
  {0.5, 0, 0, 1, 1},  // H (similar to G)
  {1, 1, 1, 1, 0},    // I (pinky up)
  {1, 1, 1, 1, 0.5},  // J (pinky up + curve)
  {0.5, 0, 0.5, 1, 1},// K (thumb touches middle, index up)
  {0.5, 0, 1, 1, 1},  // L (thumb+index make L)
  {0.5, 1, 1, 0.5, 0.5},// M (three fingers over thumb)
  {0.5, 1, 1, 1, 0.5},// N (two fingers over thumb)
  {0.5, 0.5, 0.5, 0.5, 0.5},// O (circular)
  {0.5, 0, 0, 1, 1},  // P (like K downward)
  {0.5, 0, 0, 1, 1},  // Q (like G downward)
  {1, 0, 0, 1, 1},    // R (index and middle crossed)
  {1, 1, 1, 1, 1},    // S (fist)
  {1, 1, 1, 0, 0},    // T (thumb under index)
  {1, 0, 0, 1, 1},    // U (index+middle up)
  {1, 0.5, 0.5, 1, 1},// V (two-finger V)
  {1, 0, 0, 0, 1},    // W (three fingers up)
  {1, 0.5, 1, 1, 1},  // X (index bent)
  {0.5, 1, 1, 1, 0},  // Y (thumb + pinky out)
  {0, 0, 0, 0, 0.5}   // Z (scribble motion but treat as mostly straight)
};

void setup() {
  Serial.begin(9600);
  for (int i = 0; i < 5; i++)
    initReadings[i] = analogRead(pins[i]);
  Serial.println("Calibrated.");
}

void calcFingers() {
  for (int i = 0; i < 5; i++) {
    scores[i] = constrain(floor((analogRead(pins[i]) - initReadings[i]) / 5),0, 2) / 2.0;
  }
}

char matchLetter() {
  float minError = 9999;
  int best = -1;
  for (int l = 0; l < 26; l++) {
    float err = 0;
    for (int f = 0; f < 5; f++)
      err += abs(aslLetters[l][f] - scores[f]);
    if (err < minError) {
      minError = err;
      best = l;
    }
  }
  const char* letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  return letters[best];
}

void loop() {
  calcFingers();
  char letter = matchLetter();
  Serial.print("Detected: ");
  Serial.println(letter);
  delay(300);
}