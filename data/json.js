const jsonString = '{  "H": "Streaming",  "M": "feed",  "A": ["TimingData",{  "Lines": {"23": {  "Sectors": {"2": {  "Segments": {"0": {  "Status": 2048}  }}  }}  }},"2024-07-07T13:24:02.223Z"  ]}'
try {
  const parsedJson = JSON.parse(jsonString);
  console.log("JSON is valid!");
  console.log("Parsed structure:", JSON.stringify(parsedJson, null, 2));
} catch (e) {
  console.error("JSON is invalid:", e.message);
}