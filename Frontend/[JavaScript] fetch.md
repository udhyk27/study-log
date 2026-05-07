fetch("https://jsonplaceholder.typicode.com/posts", option)
   .then(res => res.text())
   .then(text => console.log(text));
출처: https://inpa.tistory.com/entry/JS-📚-AJAX-서버-요청-및-응답-fetch-api-방식 [Inpa Dev 👨‍💻:티스토리]