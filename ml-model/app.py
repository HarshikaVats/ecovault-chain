# from prediction import processImage
from flask_cors import CORS
from flask import Flask, request, jsonify
app = Flask(__name__)

CORS(app)

#this is openVINO API v1 and will be deprecated soon
#from openvino import inference_engine as ie

# API v2
from openvino.runtime import Core, Layout, Type
from openvino.preprocess import ColorFormat, PrePostProcessor, ResizeAlgorithm

# this is from v1: from openvino.inference_engine import IECore
from transformers import CLIPProcessor, CLIPModel, pipeline

# load pre-trained model
model = CLIPModel.from_pretrained("openai/clip-vit-base-patch16")
# load preprocessor for model input
processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch16")

import json
import requests
import numpy as np

from urllib.request import urlretrieve
from pathlib import Path
from PIL import Image

# Function for processing the image
def processImage(imgURL, labels, requestedBy):
    sample_path = Path("data/coco.jpg")
    sample_path.parent.mkdir(parents=True, exist_ok=True)

    try:
        urlretrieve(
            imgURL,
            sample_path,
        )
    except Exception as e:
        return "Incorrect Image Path"

    image = Image.open(sample_path)

    input_labels = labels
    text_descriptions = [f"This is a photo of a {label}" for label in input_labels]

    inputs = processor(text=text_descriptions, images=[image], return_tensors="pt", padding=True)

    results = model(**inputs)
    logits_per_image = results['logits_per_image']  # this is the image-text similarity score
    probs = logits_per_image.softmax(dim=1).detach().numpy()  # we can take the softmax to get the label probabilities

    prob = logits_per_image.softmax(dim=1).detach().numpy()[0]
    result = np.array(prob)

    sorted_indices = np.argsort(result)
    sorted_result = result[sorted_indices]

    # threshold = 0 if requestedBy == "brands" else 0.2
    threshold = 0
    num_results_to_return = 1 if requestedBy == "brands" else 3
    print("Requested by: ", requestedBy)
    print("Threshold", threshold)
    print("Num of labels to return", num_results_to_return)

    # Making a dictionary
    label_to_value = dict(zip(input_labels, prob))
    
    # In case of brands, only a single label with > 80% probability will be sent back
    # whereas in the case of customers, 4 labels with the highest probabilities will be returned back
    filtered_label_to_value = {k: v for k, v in label_to_value.items() if v > threshold}

    # sorting the dictionary in descending order
    sorted_filtered_label_to_value = dict(sorted(filtered_label_to_value.items(), key=lambda item: item[1], reverse=True))
    
    results = dict(list(sorted_filtered_label_to_value.items())[:num_results_to_return])
    print(results)
    return results

@app.route('/')
def build():
    image = request.args.get("image", "nan")
    thetaImage = request.args.get("thetaImage", "nan")
    requestedBy = request.args.get("by", "brands")

    print(image)
    print(thetaImage)
    
    if (image == "nan" and thetaImage == "nan"):
        print("ERROR! No image supplied")
        return {"Error": "No image provided"}
    elif image != "nan":
        image = "https://versatilevats.com/openshift/tmp/"+image
        print("Image URL is: " + image)
    elif thetaImage != "nan":
        image = thetaImage
        print("Theta Image Url is: " + image)
    
    url = 'https://versatilevats.com/openshift/labels.txt'
    response = requests.get(url)
    if response.status_code == 200:
        labels = response.text.split('\n')
        print(labels)
        # return labels
        res = processImage(image,labels,requestedBy)

        # check whether a correct image path was provided:
        if res == "Incorrect Image Path":
            return {"Error": "Incorrect Image Path Provided!"}
        # check whether the result is empty or not?
        elif len(res) == 0:
            return {"Error": "No labels can be found!"}
        
        try:
            final_res = {key: str(value) for key, value in res.items()}
            json_object = jsonify(final_res)
            print(json_object)
            return json_object
        except Exception as e:
            # Code to handle the exception
            print(f"An exception occurred: {e}")
            return {"Error": "Unreachable Image! Try again"}
    else:
        print("Error while fetching the labels")
        return {"Error": "Labels can't be fetched! Try again"}
  
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)
