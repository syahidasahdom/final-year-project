from flask import Flask, request, jsonify
from flask_cors import CORS  # Import CORS
import joblib
from datetime import datetime
import requests
import numpy
import pandas as pd

app = Flask(__name__)

CORS(app, resources={r"/predict": 
    {"origins": "http://localhost:3000"}})

# Define a route for the root URL
@app.route('/')
def home():
    return 'Welcome to the Parking Availability Prediction API!'

# Define a route to handle favicon requests
@app.route('/favicon.ico')
def favicon():
    return ''

holidays_csv = pd.read_csv('encoded_holidays.csv') 

def get_holiday(date):
    # Convert the input date string to a datetime object
    #date_object = datetime.strptime(date, '%Y-%m-%d')

    # Step 2: Connect to API to check if there's a holiday on the date
    api_key = '6084078ab29632c3a322a5ddc8a3073a1042967e'
    api_url = f'https://calendarific.com/api/v2/holidays?api_key={api_key}&country=MY&year={date.year}&month={date.month}&day={date.day}'

    try:
        response = requests.get(api_url)
        response.raise_for_status()  # Raise an exception for bad responses (e.g., 404)

        holiday_data = response.json()

        # Check if 'response' is present in the JSON data
        if 'response' in holiday_data:
            is_holiday = 'holidays' in holiday_data['response'] and len(holiday_data['response']['holidays']) > 0

            # Further processing based on 'is_holiday'
            if is_holiday:

                # Add your logic to obtain the encoded label if needed
                try:
                    holiday_name = holiday_data['response']['holidays'][0]['name']
                    matching_holiday = holidays_csv[holidays_csv['HolidaysName'] == holiday_name]

                    if not matching_holiday.empty:
                        encoded_label = matching_holiday['NumericEncoded'].values[0]
                        print(f"Holiday Name: {holiday_name}, Encoded label: {encoded_label}")
                    else:
                        print("Error: Matching holiday not found in the CSV.")
                except Exception as processing_error:
                    print(f"Error in processing holiday: {processing_error}")
                    raise  # Reraise the exception to see the full traceback
            else:
                encoded_label = 47

        else:
            raise KeyError("'response' key not found in the API response")

    except requests.exceptions.RequestException as e:
        print(f"Error connecting to API: {e}")
        return None
    except Exception as e:
        print(f"Error in processing: {e}")
        print("Full traceback:")
        import traceback
        traceback.print_exc()  # Print the full traceback
        return None

    return encoded_label

def get_forecast(date_time):
    
    # Parse the input datetime string
    #dt_object = datetime.strptime(date_time, '%Y-%m-%d %H:%M')

    # Format the datetime object as a string in the desired API format
    formatted_datetime = date_time.strftime('%Y-%m-%dT%H:%M')

    # Make the API request
    response = requests.get("https://api.open-meteo.com/v1/forecast?latitude=3.1412&longitude=101.6865&hourly=temperature_2m,rain&forecast_days=16")
    
    # Check if the request was successful (status code 200)
    if response.status_code == 200:
        data = response.json()

        # Extract relevant information from the API response
        time_index = data["hourly"]["time"].index(formatted_datetime)
        temperature = data["hourly"]["temperature_2m"][time_index]
        rain = data["hourly"]["rain"][time_index]
        
        return temperature, rain
    else:
        # Print an error message if the request was not successful
        print(f"Error: {response.status_code}")
        return None

def process_input(user_input_datetime):
    # Convert the input string to a datetime object
    user_datetime = datetime.strptime(user_input_datetime, '%Y-%m-%dT%H:%M')

    # Extract features from the datetime object
    peak_hour = 1 if (12 <= user_datetime.hour <= 14) or (16 <= user_datetime.hour <= 18) else 0

    # Define the get_holiday function or import it if it's in a separate module
    holidays = get_holiday(user_datetime.date())  # You need to define list_of_holidays
    
    result = get_forecast(user_datetime)
    temperature, rain = result
    
    # Extract features from the datetime object
    open_hour = 1 if 10 <= user_datetime.hour <= 20 else 0
    
    day_of_week = user_datetime.weekday()
    
    input_data = [[peak_hour, holidays, temperature, rain, open_hour, day_of_week]]
    return input_data   

# Example user input
# user_input_datetime = '2023-10-15 11:00:00'
# input_data = (process_input(user_input_datetime))
 
# Load the machine learning model
filename = 'regression_model.joblib'
loaded_model = joblib.load(open(filename, 'rb'))

@app.route('/predict', methods=['POST'])

def predict():
    try:
        # Access input data using request.json
        data = request.json

        # Process the input data
        input_data = process_input(data['datetime'])

        # Make predictions
        predictions = loaded_model.predict(input_data)

        # Define the bin ranges and bin names
        bin_ranges = [0, 1000, 2000, 3000, 4000, 5000, 6000]
        bin_names = [0, 1, 2, 3, 4, 5]

        # Create a dictionary to map bin indices to bin ranges
        bin_mapping = {bin_idx: f'{bin_ranges[bin_idx]}-{bin_ranges[bin_idx + 1]}' for bin_idx in range(len(bin_names))}

        # Create a list to store the corresponding bin ranges for each prediction
        output_bin_ranges = []

        # Map each prediction to its corresponding bin range
        for prediction in predictions:
            output_bin_range = bin_mapping.get(prediction, 'Unknown')
            output_bin_ranges.append(output_bin_range)

        # Return the result along with the input features as JSON
        result = {
            "result": output_bin_ranges,
            "features": {
                "peak_hour": input_data[0][0],
                "holidays": input_data[0][1],
                "temperature": input_data[0][2],
                "rain": input_data[0][3],
                "open_hour": input_data[0][4],
                "day_of_week": input_data[0][5],
            }
        }

        return jsonify(result)

    except Exception as e:
        # Handle exceptions, log them, and return an error response if needed
        return jsonify({"error": str(e)})


if __name__ == '__main__':
    app.run(debug=True)
