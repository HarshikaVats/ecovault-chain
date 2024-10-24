from flask import Flask, request, jsonify, send_file
from gradio_client import Client
from flask_cors import CORS
import requests
import os

app = Flask(__name__)

CORS(app)

# Define the endpoint
endpoint = "https://stablevitobqom55g9y5-f82c9e30b11a5427.tec-s10.onthetaedgecloud.com/"
client = Client(endpoint)

@app.route('/', methods=['GET'])
def home():
    return jsonify(message="Model is running")

@app.route('/', methods=['POST'])
def run_model():
    data = request.get_json()

    # Check if model_image_url and garment_image_url are provided
    model_image_url = data.get('model_image_url')
    garment_image_url = data.get('garment_image_url')
    steps = data.get('steps', 10)
    customized_model = data.get('customized_model', True)

    if not model_image_url:
        return jsonify({"error": "model_image_url is required"}), 400

    if not garment_image_url:
        return jsonify({"error": "garment_image_url is required"}), 400

    try:
        result = client.predict(
            model_image_url,  # URL to image in 'Model' Image component
            garment_image_url,  # URL to image in 'Garment' Image component
            steps,  # Numeric value in 'Steps' Slider component
            customized_model,  # Boolean in 'customized model' Checkbox component
            fn_index=2  # Function index
        )

        file_path = result  # Assuming the result is the file path
        return jsonify({"file_path": file_path})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/download_image', methods=['GET'])
def download_image():
    file_path = request.args.get('file_path')
    if not file_path or not os.path.exists(file_path):
        return jsonify({"error": "File not found"}), 404
    
    return send_file(file_path, mimetype='image/png')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
