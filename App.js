import React, { useState } from 'react';
import axios from 'axios';
import { FaSpinner } from 'react-icons/fa';
import parkingImage from './Top.jpg';

function App() {
    const [datetime, setDatetime] = useState('');
    const [prediction, setPrediction] = useState('');
    const [features, setFeatures] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handlePredict = async () => {
        setLoading(true);
        setError('');
    
        try {
            // Ensure the minutes are '00' when making the prediction
            const adjustedDatetime = datetime.replace(/:\d{2}$/, ':00');

            const response = await axios.post
            ('http://localhost:5000/predict', 
                { datetime: adjustedDatetime });
    
            console.log('Response:', response);
            console.log('Response Data:', response.data);
    
            if (response.data.result !== undefined) {
                setPrediction(response.data.result.join(', '));
                setFeatures(response.data.features);
            } else {
                setError('Date entered is not valid.');
                console.error('Prediction result is undefined or null.');
                setPrediction('');
                setFeatures({});
            }
        } catch (error) {
            setError('Date entered is not valid.');
            console.error('Error predicting parking availability:', error);
            setPrediction('');
            setFeatures({});

        } finally {
            setLoading(false);
        }
    };
    

    return (
        <div style={{ position: 'relative', height: '100vh', overflow: 'hidden' }}>
            <img
                src={parkingImage}
                alt="Parking Image"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
           
                <h1 style={{
                    position: 'absolute',
                    top: '4%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: '1',
                    color: 'white',
                    fontSize: '50px',
                    textShadow: '8px 8px 4px rgba(0, 0, 0, 0.5)',
                    textAlign: 'center'
                }}>
                    KLCC Parking Availability Prediction System
                </h1>

            <div
                style={{
                    textAlign: 'center',
                    margin: '20px',
                    position: 'absolute',
                    zIndex: '2',
                    top: '80%',
                    left: '45%',
                    transform: 'translate(-50%, -50%)',
                    color: 'white',
                    fontSize: '25px',
                    fontFamily: 'serif',
                    
                }}
            >
                
                <label style={{ margin: '10px' }}>Date and Time:</label>
                <input
                    type="datetime-local"
                    value={datetime}
                    onChange={(e) => setDatetime(e.target.value)}
                    style={{ 
                        margin: '10px',
                        padding: '10px',
                        width: '250px',
                        height: '15px',
                        fontSize: '16px',
                        borderRadius: '5px',
                        border: '1px solid #ccc',
                        fontFamily: 'serif',
                    }}
                />
                {error && (
                    <div style={{ color: 'red', marginTop: '10px' }}>
                        Error: {error}
                    </div>
                )}
                
                <br />
                <button
                    style={{
                        padding: '10px',
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        height: '40px',
                        width: '80px',
                        fontSize: '18px',
                        fontFamily: 'serif',
                    }}
                    onClick={handlePredict}
                    disabled={loading}
                >
                    {loading ? <FaSpinner className="spinner" /> : 'Predict'}
                </button>
                <br /><br />
                <div style={{ display: 'inline-block', marginLeft: '20px' }}>
                    {prediction && (
                        <div >
                      
                            <p style={{ margin: '10px', fontSize: '1em' }}>
                                Prediction: {prediction} available parking spaces
                            </p>
                            <div style={{
                            textAlign: 'center',
                            position: 'absolute',
                            zIndex: '2',
                            top: '60%',  // Adjust the top position
                            left: '140%', // Adjust the left position
                            transform: 'translate(-50%, -50%)',
                            color: 'white',
                        }}
                        >
                            <table style={{
                                width: '200%',
                                borderCollapse: 'collapse',
                                marginTop: '-50px',
                                border: '1px solid #ddd',
                                fontSize: '14px'
                            }}>
                                <tbody>
                                    <tr style={{ background: '#f2f2f2' }}>  {/* Background color for header row */}
                                        <td style={{ border: '1px solid #ddd', padding: '8px', color: 'black' }}>Feature</td>
                                        <td style={{ border: '1px solid #ddd', padding: 'px', color: 'black' }}>Value</td>
                                    </tr>
                                    
                                    <tr>
                                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>Peak Hour</td>
                                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>{features.peak_hour}</td>
                                    </tr>
                                    <tr>
                                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>Holidays</td>
                                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>{features.holidays}</td>
                                    </tr>
                                    <tr>
                                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>Temperature</td>
                                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>{features.temperature}</td>
                                    </tr>
                                    <tr>
                                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>Rain</td>
                                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>{features.rain}</td>
                                    </tr>
                                    <tr>
                                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>Open Hour</td>
                                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>{features.open_hour}</td>
                                    </tr>
                                    <tr>
                                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>Day of Week</td>
                                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>{features.day_of_week}</td>
                                    </tr>
                                </tbody>
                            </table>
                            
                            </div>
                            
                            
                        </div>
                        
                        
                    )}
                </div>
            </div>
        </div>
    );
}

export default App;
