from xml.etree import ElementTree
from math import radians, cos, sin, asin, sqrt
import datetime, os
    
def haversine(lon1, lat1, lon2, lat2):
    # calculate the great circle distance between two points on Earth (specified in decimal degrees)  
    # start by converting decimal degrees to radians 
    lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])
    
    # haversine formula 
    dlon = lon2 - lon1 
    dlat = lat2 - lat1 
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a)) 
    
    # Radius of earth in kilometers is 6371
    km = 6371* c
    return km

def get_pace(time, latitude, longitude, previous_time, previous_latitude, previous_longitude, previous_pace):
    if previous_latitude == 0:
        pace = 5
    else:
        delta_seconds = (time - previous_time).total_seconds()
        delta_hours = float(delta_seconds/(60*60))
        speed = haversine(float(longitude), float(latitude), float(previous_longitude), float(previous_latitude)) / delta_hours
        if speed == 0:
            pace = previous_pace
        else:
            pace = 60.0/speed   
    return pace
    

if __name__ == "__main__":
    # initialize variables
    previous_latitude = 0
    previous_longitude = 0
    previous_time = 0
    previous_pace = 0
    
    # read and open file
    file = open("cphagen.gpx", "r") 
    data = file.read() 

    answer_data = ElementTree.fromstring(data)

    file = open("full_data.js", "w")
    file.write("var points = [\n")
    for element in answer_data.findall("./{http://www.topografix.com/GPX/1/1}trk/{http://www.topografix.com/GPX/1/1}trkseg/{http://www.topografix.com/GPX/1/1}trkpt"):
        value = element.text
        time =  datetime.datetime.strptime(element.find("{http://www.topografix.com/GPX/1/1}time").text, "%Y-%m-%dT%H:%M:%SZ")
        elevation = element.find("{http://www.topografix.com/GPX/1/1}ele").text
        latitude = element.get("lat")
        longitude = element.get("lon")
        heart_rate = element.find("{http://www.topografix.com/GPX/1/1}extensions/{http://www.garmin.com/xmlschemas/TrackPointExtension/v1}TrackPointExtension/{http://www.garmin.com/xmlschemas/TrackPointExtension/v1}hr").text
        
        # calculate pace
        pace = get_pace(time, latitude, longitude, previous_time, previous_latitude, previous_longitude, previous_pace)
        
        # change previous values
        previous_latitude = latitude
        previous_longitude = longitude
        previous_time = time
        previous_pace = pace

        file.write("   {elev: " + elevation + ", pace: " + str(pace) + ", lat: " + latitude + ", lng: " + longitude + ", heart_rate: " + heart_rate + "},\n")

    file.seek(-2, os.SEEK_END)
    file.truncate()
    file.write("\n];")
    file.close()
    