# HQML — Hybrid Quantum-Classical Knee Abnormality Detection Platform

> **DISCLAIMER**: Research/decision-support prototype only — NOT a substitute for professional medical diagnosis.
> This software is not a medical device. Results must not be used for clinical decision-making.

## Overview

HQML is an experimental research web platform exploring hybrid quantum-classical machine learning for detecting ACL abnormality vs normal from knee MRI studies.

**Research scope**: ACL abnormality only.

## Dataset

Target: RSNA Knee Abnormality Detection (Kaggle)
https://www.kaggle.com/competitions/rsna-knee-abnormality-detection/data

The dataset is NOT included. Set: RSNA_DATA_DIR=/path/to/rsna

## Setup

### Backend
```
cd backend
npm install
npm run build
npm run migrate:dev
npm run dev
```

### Frontend
```
cd frontend
npm install
npm run dev
```

### ML Service
```
cd ml-service
pip install -r requirements.txt
python main.py
```

## Environment Variables

See .env.example for all variables (DATABASE_URL, JWT_SECRET, ML_SERVICE_URL, RSNA_DATA_DIR, etc.)

## Execution Modes

- REAL: Actual RSNA DICOM data
- SIMULATION: Quantum circuit on classical simulator (PennyLane default.qubit)
- DEMO: Synthetic data fallback

## Limitations

- Prototype only, not clinically validated
- ACL target only
- Labels are report-derived (not clinical ground truth)
- ResNet18 is ImageNet pretrained (not ACL-specific)
- PennyLane simulator (not quantum hardware)
- No quantum advantage claimed
