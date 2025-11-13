import json
import re

def lambda_handler(event, context):
    """
    Assigns severity level based on sentiment analysis results
    """
    
    # Extract sentiment data from Bedrock response
    sentiment_response = event.get('Body', {})
    transcript = event.get('transcript', '')
    
    # Parse sentiment from Bedrock response
    sentiment_text = sentiment_response.get('content', [{}])[0].get('text', '')
    
    # Extract sentiment and intensity using regex
    sentiment_match = re.search(r'sentiment[:\s]*(positive|negative|neutral)', sentiment_text.lower())
    intensity_match = re.search(r'intensity[:\s]*(\d+)', sentiment_text.lower())
    
    sentiment = sentiment_match.group(1) if sentiment_match else 'neutral'
    intensity = int(intensity_match.group(1)) if intensity_match else 5
    
    # Assign severity based on sentiment and intensity
    severity = calculate_severity(sentiment, intensity, transcript)
    
    # Add severity to the event data
    event['severity'] = severity
    event['sentiment'] = sentiment
    event['intensity'] = intensity
    
    return event

def calculate_severity(sentiment, intensity, transcript):
    """
    Calculate severity level based on sentiment, intensity, and keywords
    """
    
    # High priority keywords
    urgent_keywords = ['urgent', 'critical', 'emergency', 'broken', 'down', 'not working']
    complaint_keywords = ['complaint', 'angry', 'frustrated', 'disappointed', 'terrible']
    
    # Check for urgent keywords
    transcript_lower = transcript.lower()
    has_urgent = any(keyword in transcript_lower for keyword in urgent_keywords)
    has_complaint = any(keyword in transcript_lower for keyword in complaint_keywords)
    
    # Severity calculation
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
