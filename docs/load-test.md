# Load Test
Quiz generation async (p95 <300ms non-AI, AI via poll to avoid timeout).
k6 script 50 concurrent:
```js
import http from 'k6/http';
export default function () {
  http.post('http://localhost:5000/api/v1/children/demo/quizzes/generate', JSON.stringify({ scope:'last7', numQuestions:10 }), { headers:{ 'Content-Type':'application/json', Authorization:'Bearer '+ __ENV.TOKEN }});
}
```
Run: `k6 run load-test.js` — idempotency keys prevent double creation.
DB indexes: (child_id, date), FK indexes, dashboard aggregates.
