# 🍵 KopiVision — Klasifikasi Jenis Biji Kopi

Sistem klasifikasi citra biji kopi berbasis web menggunakan **CNN MobileNetV2** dengan framework **Flask**.  
Metodologi: **CRISP-DM** | Kelas: **Arabika · Liberika · Robusta**

> 📌 Skripsi Adis Koswara · 50422086 · Universitas Gunadarma · 2026

---

## 🗂️ Struktur Proyek

```
klasifikasi-biji-kopi/
├── app.py                     # Flask main application
├── requirements.txt           # Python dependencies
├── .gitignore
│
├── model/
│   └── coffee_mobilenetv2.h5  # Model hasil training (dihasilkan notebook)
│
├── dataset/                   # Dataset mentah dari Roboflow
│   ├── Arabika/
│   ├── Liberika/
│   └── Robusta/
│
├── dataset_split/             # Dataset setelah split (dihasilkan notebook)
│   ├── train/
│   ├── val/
│   └── test/
│
├── notebooks/
│   └── training.ipynb         # Notebook training CRISP-DM
│
├── static/
│   ├── css/style.css
│   ├── js/main.js
│   └── uploads/               # Upload gambar sementara
│
└── templates/
    ├── index.html             # Halaman utama (Upload + Kamera)
    ├── result.html            # Hasil klasifikasi
    └── about.html             # Informasi jenis kopi
```

---

## ⚡ Cara Menjalankan

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Siapkan Dataset
Download dataset dari Roboflow dan letakkan di:
```
dataset/
├── Arabika/   ← gambar biji kopi arabika
├── Liberika/  ← gambar biji kopi liberika
└── Robusta/   ← gambar biji kopi robusta
```

### 3. Jalankan Notebook Training
```bash
jupyter notebook notebooks/training.ipynb
```
Jalankan semua sel. Model akan tersimpan otomatis ke `model/coffee_mobilenetv2.h5`

### 4. Jalankan Flask App
```bash
python app.py
```
Akses di: **http://localhost:5000**

---

## 🔬 Fitur Aplikasi

| Fitur | Deskripsi |
|---|---|
| 📤 Upload Foto | Drag-and-drop gambar biji kopi (JPG/PNG/WEBP, max 10MB) |
| 📷 Kamera Real-Time | Deteksi otomatis via webcam setiap 1.5 detik |
| 📊 Confidence Score | Persentase keyakinan model + bar chart semua kelas |
| 📚 Info Edukatif | Karakteristik kopi (asal, kafein, aroma, rasa, seduhan) |
| 🚫 Anti-Salah Klasifikasi | Confidence < 50% → "Tidak Dikenali" |

---

## 📈 Performa Model

| Metrik | Nilai |
|---|---|
| Test Accuracy | **89.97%** |
| Test Loss | **0.5806** |
| Arabika F1 | **0.90** |
| Liberika F1 | **0.91** |
| Robusta F1 | **0.90** |

---

## 🛠️ Teknologi

- **Python 3.12** · **Flask 3.x** · **TensorFlow 2.x / Keras**
- **MobileNetV2** (Transfer Learning dari ImageNet)
- **HTML · CSS · JavaScript** (Vanilla)
- **Dataset**: Roboflow — 1,913 citra total
