# 🍵 KopiVision — Klasifikasi Jenis Biji Kopi

Sistem klasifikasi citra biji kopi berbasis web menggunakan **Convolutional Neural Network (CNN) MobileNetV2** dengan framework **Flask**. Penelitian menggunakan metodologi **Cross Industry Standard Process for Data Mining (CRISP-DM)** yang terdiri dari Business Understanding, Data Understanding, Data Preparation, Modeling, Evaluation, dan Deployment.

Sistem dikembangkan untuk mengklasifikasikan tiga jenis biji kopi, yaitu **Arabika, Liberika, dan Robusta**.

> 📌 Skripsi Adis Koswara · 50422086 · Universitas Gunadarma · 2026

---

## 🗂️ Struktur Proyek

```text
klasifikasi-biji-kopi/
├── app.py
├── requirements.txt
├── README.md
├── .gitignore
│
├── model/
│   ├── coffee_mobilenetv2.h5
│   └── hasil_training.png
│
├── static/
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── main.js
│
└── templates/
    ├── about.html
    ├── dashboard.html
    ├── index.html
    └── result.html
```

> Dataset dan notebook training tidak disertakan dalam repository aplikasi utama. Model hasil training disimpan pada folder `model/` dan digunakan oleh aplikasi Flask untuk proses klasifikasi.

---

## ⚡ Cara Menjalankan

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Siapkan Model

Pastikan file model hasil training tersedia pada:

```text
model/coffee_mobilenetv2.h5
```

### 3. Jalankan Flask App

```bash
python app.py
```

Kemudian akses:

```text
http://localhost:5000
```

---

## 🔬 Fitur Aplikasi

| Fitur | Deskripsi |
|---|---|
| 📤 Upload Foto | Mengunggah citra biji kopi untuk dilakukan klasifikasi |
| 📷 Kamera | Menggunakan kamera sebagai input citra untuk klasifikasi |
| 📊 Confidence Score | Menampilkan tingkat keyakinan model terhadap hasil prediksi |
| 📚 Informasi Kopi | Menampilkan informasi mengenai karakteristik jenis kopi |
| 🖼️ Hasil Klasifikasi | Menampilkan hasil prediksi jenis biji kopi berdasarkan citra masukan |

---

## 📊 Dataset

Dataset diperoleh dari **Roboflow** dengan total **1.913 citra**.

| Kelas | Jumlah |
|---|---:|
| Arabika | 633 |
| Liberika | 639 |
| Robusta | 641 |
| **Total** | **1.913** |

Dataset dibagi menggunakan proporsi:

| Data | Persentase | Jumlah |
|---|---:|---:|
| Training | 70% | 1.338 |
| Validation | 15% | 285 |
| Testing | 15% | 290 |
| **Total** | **100%** | **1.913** |

---

## 🖼️ Data Preparation

Tahap persiapan data meliputi:

- Labeling kelas Arabika, Liberika, dan Robusta.
- Resize citra menjadi **224 × 224 piksel**.
- Konversi citra ke format **RGB**.
- Normalisasi nilai piksel.
- Augmentasi online pada data training.
- Penerapan class weighting.

---

## 🧠 Model

Model klasifikasi menggunakan:

- **Convolutional Neural Network (CNN)**
- **MobileNetV2**
- **Transfer Learning**
- **Fine-Tuning**
- Input citra: **224 × 224 × 3**
- Jumlah kelas: **3**
  - Arabika
  - Liberika
  - Robusta

---

## 📈 Performa Model

Evaluasi dilakukan menggunakan **290 citra data testing**.

| Metrik | Nilai |
|---|---:|
| **Test Accuracy** | **91,38%** |
| **Test Loss** | **0,5507** |
| **Precision Arabika** | **89%** |
| **Recall Arabika** | **94%** |
| **F1-Score Arabika** | **91%** |
| **Precision Liberika** | **93%** |
| **Recall Liberika** | **89%** |
| **F1-Score Liberika** | **91%** |
| **Precision Robusta** | **92%** |
| **Recall Robusta** | **92%** |
| **F1-Score Robusta** | **92%** |

### Classification Report

```text
              precision    recall    f1-score    support

arabika          0.89       0.94       0.91         96
liberika         0.93       0.89       0.91         97
robusta          0.92       0.92       0.92         97

accuracy                               0.91        290
macro avg        0.91       0.91       0.91        290
weighted avg     0.91       0.91       0.91        290
```

---

## 🛠️ Teknologi

- **Python 3.12**
- **Flask 3.x**
- **TensorFlow / Keras**
- **MobileNetV2**
- **Transfer Learning**
- **Fine-Tuning**
- **HTML**
- **CSS**
- **JavaScript**
- **Roboflow**
- **CRISP-DM**

---

## 🧪 Pengujian Aplikasi

### Black-Box Testing

Pengujian Black-Box dilakukan terhadap fungsi utama aplikasi. Hasil pengujian menunjukkan seluruh fungsi utama berjalan sesuai dengan kebutuhan fungsional yang dirancang.

### User Acceptance Testing

UAT dilakukan terhadap **10 responden** menggunakan skala Likert lima tingkat.

Hasil pengujian memperoleh:

**94,40% tingkat penerimaan pengguna.**

---

## 📌 Ringkasan

Penelitian ini berhasil mengembangkan sistem klasifikasi tiga jenis biji kopi menggunakan **MobileNetV2** dengan metodologi **CRISP-DM**. Model memperoleh **accuracy 91,38%** pada 290 data uji dengan test loss sebesar **0,5507**. Model kemudian diintegrasikan ke aplikasi web berbasis Flask dengan fitur upload gambar, kamera, confidence score, dan informasi mengenai jenis kopi.
