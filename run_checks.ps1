echo "--- Check 1 ---"
python _check1.py
echo "--- Check 2 ---"
python _check2.py
echo "--- Check 3 ---"
python _check3.py
echo "--- Check 4 ---"
python _check4.py
echo "--- Check 5 ---"
python _check5.py
echo "--- Check 6 ---"
python _check6.py
echo "--- Check 7 ---"
curl.exe http://localhost:8000/health
echo "--- Check 8 ---"
curl.exe -X POST http://localhost:8000/verify -H "Content-Type: application/json" -d '{\"text\": \"The Eiffel Tower is in Paris\", \"url\": null}' --no-buffer 2>&1 | Select-Object -First 30
echo "--- Check 9 ---"
python _check9.py
echo "--- Check 10 ---"
python _check10.py
