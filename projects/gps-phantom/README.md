# GPS Phantom: AI-Powered Location Simulator

GPS Phantom is an advanced location simulation system designed for privacy and security research. It uses an AI-powered trajectory engine to generate physically realistic movement patterns that pass sophisticated multi-signal consistency checks.

## Key Components

- **Phantom App:** A Jetpack Compose Android app for planning trajectories and managing the simulation.
- **Ghost Module:** An Xposed/LSPosed module that hooks into the Android framework to hide mock location status and inject synthetic GNSS data.
- **AI Trajectory Engine:** A TFLite-based model trained on real human movement data to generate indistinguishable GPS traces.

## Architecture

1. **Trajectory Generation:** The app uses a sequence-to-sequence LSTM model to generate (lat, lng, speed, bearing, altitude) tuples.
2. **Adversarial Scoring:** Each generated point is scored against known detection heuristics (speed consistency, bearing drift, accuracy variance).
3. **Undetectable Injection:** The Ghost Module strips the `isMock()` flag and provides consistent sensor/satellite metadata.

## Build Instructions

The project is built using Gradle. You can build the APKs using the following command:

```bash
./gradlew assembleDebug
```

The resulting APKs will be located in:
- `app/build/outputs/apk/debug/app-debug.apk`
- `ghost-module/build/outputs/apk/debug/ghost-module-debug.apk`

## License

MIT License
