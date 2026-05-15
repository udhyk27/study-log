---
notion_page_id: 36181856-910c-8146-b089-ff18291f2e5b
---
화살표 함수와 매개변수에 따라 달라지는 이벤트 핸들러 작성법

자바스크립트에서 addEventListener를 쓰다 보면
아래 두 코드의 차이가 헷갈리는 경우가 많다.

button.addEventListener('click', openModal);
button.addEventListener('click', () => openModal(button));


겉보기엔 비슷하지만 의미와 실행 시점은 완전히 다르다.
이 글에서는 화살표 함수 사용 여부, 매개변수 유무에 따라
코드가 어떻게 달라져야 하는지 정리해본다.

1. addEventListener의 핵심 규칙
addEventListener('click', handler)


여기서 handler에는 반드시 함수 참조가 와야 한다.

❌ 잘못된 예

addEventListener('click', openModal());


() 때문에 즉시 실행됨

클릭과 무관하게 페이지 로드 시 실행됨

✅ 올바른 예

addEventListener('click', openModal);

2. 매개변수가 없는 경우 (가장 기본)
📌 상황

클릭된 요소 정보는 이벤트 객체(event)로 충분

별도의 인자를 넘길 필요 없음

코드
function openModal(e) {
    console.log(e.currentTarget);
}

button.addEventListener('click', openModal);

동작 방식

클릭 발생

브라우저가 자동으로 openModal(event) 호출

👉 이 경우 화살표 함수는 필요 없다

3. 매개변수가 필요한 경우 (화살표 함수가 필요한 이유)
📌 상황

클릭된 버튼 외에 특정 값을 넘겨야 함

예: 버튼별 다른 모달 ID, 타입, 데이터 등

❌ 잘못된 코드
button.addEventListener('click', openModal(button));


이 코드는 이렇게 해석된다:

// 페이지 로드 시 즉시 실행
const result = openModal(button);
addEventListener('click', result);

✅ 올바른 코드 (화살표 함수 사용)
button.addEventListener('click', () => openModal(button));

5. 헷갈리기 쉬운 고급 패턴: 핸들러를 반환하는 함수

아래 코드를 보자.

const openModal = (btn) => () => {
    console.log(btn);
};


이 함수는 모달을 여는 함수가 아니라
👉 이벤트 핸들러를 만들어주는 함수다.

사용법
button.addEventListener('click', openModal(button));

왜 이게 동작할까?
openModal(button)
// 실행 결과: function () { console.log(button); }


즉,

openModal(button)은 즉시 실행됨

반환된 함수가 이벤트 핸들러로 등록됨

6. 이 경우 화살표 함수로 감싸면 왜 안 되는가?
button.addEventListener('click', () => openModal(button));


이렇게 하면:

클릭

openModal(button) 실행

함수만 반환

반환된 함수는 실행되지 않음 ❌

👉 그래서 “두 번 눌러야 되는 것처럼 보이는” 현상이 생길 수 있다.

7. 실무에서 추천하는 패턴
✅ 패턴 1 (가장 추천, 단순함)
function openModal(e) {
    const btn = e.currentTarget;
}

button.addEventListener('click', openModal);


✔ 가독성 좋음
✔ 디버깅 쉬움
✔ 실수 적음

✅ 패턴 2 (핸들러 팩토리 패턴)
const openModal = (btn) => () => {
    console.log(btn);
};

button.addEventListener('click', openModal(button));


✔ 버튼별 데이터 바인딩에 유리
❗ 반드시 “함수를 반환한다”는 걸 인지해야 함
