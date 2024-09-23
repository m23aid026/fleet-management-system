from kafka import KafkaProducer
import json

producer = KafkaProducer(bootstrap_servers='localhost:9092',
                         value_serializer=lambda v: json.dumps(v).encode('utf-8'))

telemetry_data = {
  "deviceId": "zRYzhAEAHAABAAAKCRtcAAsAtwB1gBAS",
  "timestamp": "2024-08-17 10:38:20.000000",
  "value": 200,
  "variable": "RUN TIME SINCE ENGINE START",
  "alarmClass": 0
}

producer.send('telemetry-data', telemetry_data)
producer.flush()
