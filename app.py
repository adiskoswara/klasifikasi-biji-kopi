import os
import io
import base64
import numpy as np
from flask import Flask, request, render_template, jsonify
from PIL import Image
from werkzeug.utils import secure_filename

# ─────────────────────────────────────────────
# App Configuration
# ─────────────────────────────────────────────
app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024  # 10MB
app.config['UPLOAD_FOLDER'] = os.path.join('static', 'uploads')
ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'webp'}

# ─────────────────────────────────────────────
# Model & Label Configuration
# ─────────────────────────────────────────────
MODEL_PATH = os.path.join('model', 'coffee_mobilenetv2.h5')
CLASS_NAMES = ['Arabika', 'Liberika', 'Robusta']
IMG_SIZE = (224, 224)
CONFIDENCE_THRESHOLD = 0.50

# Informasi edukatif setiap kelas
COFFEE_INFO = {
    'Arabika': {
        'latin': 'Coffea arabica',
        'origin': 'Ethiopia, Amerika Latin, Asia Tenggara',
        'kafein': '0.8% – 1.4%',
        'aroma': 'Kacang, teh hitam, floral',
        'rasa': 'Asam tinggi, pahit sedang, kompleks',
        'keasaman': 'Tinggi',
        'body': 'Medium',
        'seduh': 'Pour over, drip, cold brew',
        'description': 'Arabika merupakan jenis kopi paling populer di dunia, dikenal dengan cita rasa yang kaya dan kompleks. Biji kopi Arabika memiliki bentuk oval yang lebih panjang dengan garis tengah yang melengkung.',
        'color': '#8B4513',
        'icon': '☕'
    },
    'Liberika': {
        'latin': 'Coffea liberica',
        'origin': 'Liberia, Afrika Barat, Filipina',
        'kafein': '1.2% – 1.7%',
        'aroma': 'Kayu, bunga, buah tropis',
        'rasa': 'Pahit kuat, sedikit asam, unik',
        'keasaman': 'Rendah – Sedang',
        'body': 'Full',
        'seduh': 'Tubruk, espresso, French press',
        'description': 'Liberika adalah jenis kopi yang langka dan unik. Biji kopinya berukuran lebih besar dari Arabika dan Robusta, dengan bentuk asimetris dan aroma yang sangat khas menyerupai buah tropis.',
        'color': '#5D3A1A',
        'icon': '🌿'
    },
    'Robusta': {
        'latin': 'Coffea canephora',
        'origin': 'Afrika Tengah, Vietnam, Indonesia',
        'kafein': '1.7% – 4.0%',
        'aroma': 'Karamel, sirup jagung, tanah',
        'rasa': 'Pahit tinggi, asam rendah, earthy',
        'keasaman': 'Rendah',
        'body': 'Full',
        'seduh': 'Espresso, instant coffee, cappuccino',
        'description': 'Robusta dikenal sebagai kopi yang kuat dengan kadar kafein tinggi. Pohon kopi Robusta lebih tahan terhadap penyakit dan hama. Biji kopinya bulat dan lebih kecil dari Arabika.',
        'color': '#3D1C02',
        'icon': '⚡'
    }
}

# ─────────────────────────────────────────────
# Load Model
# ─────────────────────────────────────────────
model = None

def load_model():
    global model
    try:
        import tensorflow as tf
        if os.path.exists(MODEL_PATH):
            model = tf.keras.models.load_model(MODEL_PATH)
            print("[OK] Model berhasil dimuat!")
        else:
            print("[WARNING] Model belum tersedia. Jalankan notebook training terlebih dahulu.")
    except Exception as e:
        print(f"[ERROR] Gagal memuat model: {e}")

# ─────────────────────────────────────────────
# Helper Functions
# ─────────────────────────────────────────────
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def preprocess_image(img: Image.Image) -> np.ndarray:
    """Preprocess image sesuai kebutuhan MobileNetV2."""
    if img.mode != 'RGB':
        img = img.convert('RGB')
    img = img.resize(IMG_SIZE, Image.LANCZOS)
    arr = np.array(img, dtype=np.float32)
    # MobileNetV2 preprocess_input: normalisasi nilai piksel ke rentang [-1, 1]
    arr = (arr / 127.5) - 1.0
    arr = np.expand_dims(arr, axis=0)
    return arr

def get_confidence_level(confidence: float) -> dict:
    """Tentukan level keyakinan berdasarkan nilai confidence."""
    if confidence >= 0.85:
        return {'label': 'Sangat Yakin', 'color': '#22c55e', 'icon': '✅'}
    elif confidence >= 0.65:
        return {'label': 'Cukup Yakin', 'color': '#f59e0b', 'icon': '⚠️'}
    else:
        return {'label': 'Kurang Yakin', 'color': '#ef4444', 'icon': '❓'}

def predict_image(img: Image.Image) -> dict:
    """Lakukan prediksi pada gambar dan kembalikan hasil lengkap."""
    if model is None:
        return {
            'success': False,
            'error': 'Model belum dimuat. Jalankan notebook training.ipynb terlebih dahulu.'
        }

    try:
        arr = preprocess_image(img)
        predictions = model.predict(arr, verbose=0)[0]
        predicted_idx = int(np.argmax(predictions))
        confidence = float(predictions[predicted_idx])

        # Jika confidence di bawah threshold → Tidak Dikenali
        if confidence < CONFIDENCE_THRESHOLD:
            return {
                'success': True,
                'class_name': 'Tidak Dikenali',
                'confidence': round(confidence * 100, 2),
                'confidence_level': {'label': 'Tidak Terdeteksi', 'color': '#6b7280', 'icon': '🚫'},
                'all_probabilities': {
                    CLASS_NAMES[i]: round(float(predictions[i]) * 100, 2)
                    for i in range(len(CLASS_NAMES))
                },
                'coffee_info': None,
                'is_recognized': False
            }

        class_name = CLASS_NAMES[predicted_idx]
        confidence_level = get_confidence_level(confidence)

        return {
            'success': True,
            'class_name': class_name,
            'confidence': round(confidence * 100, 2),
            'confidence_level': confidence_level,
            'all_probabilities': {
                CLASS_NAMES[i]: round(float(predictions[i]) * 100, 2)
                for i in range(len(CLASS_NAMES))
            },
            'coffee_info': COFFEE_INFO.get(class_name),
            'is_recognized': True
        }

    except Exception as e:
        return {'success': False, 'error': str(e)}

# ─────────────────────────────────────────────
# Routes
# ─────────────────────────────────────────────
def get_training_stats():
    """Mengembalikan statistik hasil pelatihan model sesuai train.ipynb."""
    return {
        'accuracy': '91.38%',
        'loss': '0.5507',
        'train_samples': '1.338',
        'val_samples': '285',
        'test_samples': '290',
        'total_samples': '1.913',
        'epochs_init': 20,
        'epochs_ft': 25,
        'model_name': 'MobileNetV2 (Transfer Learning)',
        'plot_exists': os.path.exists(os.path.join('model', 'hasil_training.png'))
    }


@app.route('/')
def dashboard():
    """Halaman utama (Dashboard Analitik)."""
    return render_template('dashboard.html', stats=get_training_stats())


@app.route('/klasifikasi')
def index():
    """Halaman klasifikasi (Beranda)."""
    return render_template('index.html', stats=get_training_stats())


@app.route('/result')
def result():
    """Halaman hasil klasifikasi (data dikirim via sessionStorage dari JS)."""
    return render_template('result.html')


@app.route('/about')
def about():
    """Halaman informasi biji kopi."""
    return render_template('about.html', coffee_info=COFFEE_INFO)


@app.route('/model/plot')
def get_model_plot():
    """Endpoint untuk menyajikan grafik training history jika ada."""
    plot_path = os.path.join('model', 'hasil_training.png')
    if os.path.exists(plot_path):
        from flask import send_from_directory
        return send_from_directory('model', 'hasil_training.png')
    else:
        # Jika grafik belum ada, kembalikan placeholder kosong atau 404
        return '', 404



@app.route('/predict', methods=['POST'])
def predict():
    """Endpoint prediksi melalui upload file."""
    if 'file' not in request.files:
        return jsonify({'success': False, 'error': 'Tidak ada file yang diunggah.'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'success': False, 'error': 'Nama file kosong.'}), 400

    if not allowed_file(file.filename):
        return jsonify({'success': False, 'error': 'Format file tidak didukung. Gunakan JPG, JPEG, PNG, atau WEBP.'}), 400

    try:
        img = Image.open(file.stream)
        result = predict_image(img)

        # Simpan gambar preview (opsional)
        if result.get('success'):
            filename = secure_filename(file.filename)
            save_path = os.path.join(app.config['UPLOAD_FOLDER'], 'last_upload.jpg')
            img_rgb = img.convert('RGB') if img.mode != 'RGB' else img
            img_rgb.save(save_path, 'JPEG', quality=85)
            result['image_url'] = '/static/uploads/last_upload.jpg'

        return jsonify(result)

    except Exception as e:
        return jsonify({'success': False, 'error': f'Gagal memproses gambar: {str(e)}'}), 500


@app.route('/predict_camera', methods=['POST'])
def predict_camera():
    """Endpoint prediksi melalui kamera (base64 image)."""
    data = request.get_json()
    if not data or 'image' not in data:
        return jsonify({'success': False, 'error': 'Tidak ada data gambar.'}), 400

    try:
        # Decode base64 image
        image_data = data['image']
        if ',' in image_data:
            image_data = image_data.split(',')[1]

        img_bytes = base64.b64decode(image_data)
        img = Image.open(io.BytesIO(img_bytes))
        result = predict_image(img)
        return jsonify(result)

    except Exception as e:
        return jsonify({'success': False, 'error': f'Gagal memproses frame kamera: {str(e)}'}), 500


@app.route('/model_status')
def model_status():
    """Cek status model."""
    return jsonify({
        'model_loaded': model is not None,
        'model_path': MODEL_PATH,
        'model_exists': os.path.exists(MODEL_PATH)
    })


# ─────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────
if __name__ == '__main__':
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    load_model()
    app.run(debug=True, host='0.0.0.0', port=5000)
