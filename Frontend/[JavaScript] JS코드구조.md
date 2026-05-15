---
notion_page_id: 36181856-910c-8176-9635-ccbf7c001ee8
---
# JavaScript 실무 구조 정리 (Spring + Thymeleaf 기준)

## 1. 추천 프로젝트 구조

```text
static/js/
├── utils.js        // 공통 기능
├── user.js         // 회원 페이지
├── award.js        // 수상작 페이지
└── similar.js      // 유사 이미지 페이지
```

원칙

```text
공통 함수 → utils.js
페이지 로직 → page.js
초기 실행 → init()
이벤트 등록 → setEvents()
```

---

## 2. ES Module 방식

### utils.js

```js
export function getAJAX(url, data, onSuccess) {
    $.ajax({
        url,
        type: 'GET',
        data,
        success: onSuccess
    });
}
```

### similar.js

```js
import { getAJAX } from './utils.js';

function init() {
    setEvents();
}

function setEvents() {
    document
        .querySelector('#save-btn')
        .addEventListener('click', save);
}

function save() {
    console.log('save');
}

document.addEventListener(
    'DOMContentLoaded',
    init
);
```

HTML

```html
<script type="module" src="/js/similar.js"></script>
```

---

## 3. export / import

공개

```js
export function save() {}
```

사용

```js
import { save } from './utils.js';
```

`export` 없으면 다른 파일에서 사용 불가

---

## 4. querySelector vs getElementById

### getElementById

```js
document.getElementById('save-btn');
```

- id 전용
- 조금 더 빠름

### querySelector

```js
document.querySelector('#save-btn');
document.querySelector('.title');
document.querySelector('input[name="email"]');
```

- CSS 선택자 사용
- 실무에서 더 많이 씀

---

## 5. DOM 여러 개 가져오기

### 객체 방식 (추천)

```js
const elements = {
    saveBtn: document.querySelector('#save-btn'),
    keyword: document.querySelector('#keyword'),
    modal: document.querySelector('#modal')
};
```

사용

```js
elements.modal.style.display = 'none';
```

### 여러 개 조회

```js
document
    .querySelectorAll('.btn')
    .forEach(btn => {
        btn.addEventListener('click', save);
    });
```

---

## 6. addEventListener 자주 쓰는 것

클릭

```js
button.addEventListener('click', save);
```

입력 감지

```js
input.addEventListener('input', e => {
    console.log(e.target.value);
});
```

엔터 처리

```js
input.addEventListener('keydown', e => {
    if(e.key === 'Enter') search();
});
```

폼 submit

```js
form.addEventListener('submit', e => {
    e.preventDefault();
    save();
});
```

---

## 7. e.target 활용

값 읽기

```js
e.target.value
```

data 속성

```html
<button data-id="10">
```

```js
e.target.dataset.id
```

부모 찾기

```js
e.target.closest('.row')
```

클릭 요소 체크

```js
e.target.matches('.delete-btn')
```

class 조작

```js
classList.add()
classList.remove()
classList.toggle()
```

---

## 8. 이벤트 위임 (동적 DOM)

jQuery

```js
$('#user-row').on(
    'click',
    '.cell-btn',
    function() {}
);
```

Vanilla JS

```js
document
    .querySelector('#user-row')
    .addEventListener('click', e => {

        const button =
            e.target.closest('.cell-btn');

        if(!button) return;

        const row =
            button.closest('.row');
    });
```

AJAX 후 생성된 요소 처리 시 많이 사용

---

## 9. onclick vs addEventListener

### onclick

```html
<button onclick="save()">
```

- 옛날 방식
- HTML/JS 섞임

### addEventListener

```js
button.addEventListener('click', save);
```

- 실무 표준
- 유지보수 쉬움
- 이벤트 여러 개 가능

---

## 10. 실무 추천 패턴

```js
import { getAJAX }
from './utils.js';

const elements = {
    saveBtn:
        document.querySelector('#save-btn'),

    keyword:
        document.querySelector('#keyword')
};

function init() {
    setEvents();
}

function setEvents() {
    elements.saveBtn
        .addEventListener('click', save);
}

function save() {
    console.log(
        elements.keyword.value
    );
}

document.addEventListener(
    'DOMContentLoaded',
    init
);
```

흐름

```text
utils.js → 공통 기능
page.js → 페이지 로직
init() → 시작
setEvents() → 이벤트 등록
elements → DOM 관리
```
