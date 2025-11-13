import json
import re

def lambda_handler(event, context):
    """
    Assigns severity level based on sentiment analysis results
    """
    try:
        # Extract data from Step Functions payload
        payload = event.get('Payload', event)
        
        # Get transcript from transcription result
        transcript = ""
        if 'TranscriptionJob' in payload:
            transcript_uri = payload['TranscriptionJob'].get('Transcript', {}).get('TranscriptFileUri', '')
            # In real implementation, you'd fetch from S3
            transcript = payload.get('transcript', '')
        
        # Extract sentiment from Bedrock response
        sentiment_response = payload.get('Body', {})
        if isinstance(sentiment_response, str):
            sentiment_text = sentiment_response
        else:
            sentiment_text = sentiment_response.get('content', [{}])[0].get('text', '')
        
        # Parse sentiment and intensity
        sentiment, intensity = parse_sentiment(sentiment_text)
        
        # Calculate severity
        severity = calculate_severity(sentiment, intensity, transcript)
        
        # Return enhanced payload
        result = payload.copy()
        result.update({
            'severity': severity,
            'sentiment': sentiment,
            'intensity': intensity,
            'transcript': transcript
        })
        
        return result
        
    except Exception as e:
        print(f"Error processing sentiment: {str(e)}")
        # Return original payload with default values
        result = event.copy()
        result.update({
            'severity': 'MEDIUM',
            'sentiment': 'neutral',
            'intensity': 5,
            'error': str(e)
        })
        return result

def parse_sentiment(sentiment_text):
    """Parse sentiment and intensity from Bedrock response"""
    sentiment_match = re.search(r'sentiment[:\s]*(positive|negative|neutral)', sentiment_text.lower())
    intensity_match = re.search(r'intensity[:\s]*(\d+)', sentiment_text.lower())
    
    sentiment = sentiment_match.group(1) if sentiment_match else 'neutral'
    intensity = int(intensity_match.group(1)) if intensity_match else 5
    
    return sentiment, intensity

def calculate_severity(sentiment, intensity, transcript):
    """Calculate severity based on sentiment, intensity, and keywords"""
    
    urgent_keywords = ['urgent', 'critical', 'emergency', 'broken', 'down', 'not working', 'outage']
    complaint_keywords = ['complaint', 'angry', 'frustrated', 'disappointed', 'terrible', 'awful']
    
    transcript_lower = transcript.lower()
    has_urgent = any(keyword in transcript_lower for keyword in urgent_keywords)
    has_complaint = any(keyword in transcript_lower for keyword in complaint_keywords)
    
    if sentiment == 'negative':
        if intensity >= 8 or has_urgent:
            return 'HIGH'
        elif intensity >= 6 or has_complaint:
            return 'MEDIUM'
        else:
            return 'LOW'
    elif sentiment == 'neutral':
        if has_urgent:
            return 'MEDIUM'
        else:
            return 'LOW'
    else:  # positive
        return 'LOW'
