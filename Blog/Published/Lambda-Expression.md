람다식이란

람다식(Lambda Expression)은 이름이 없는 함수를 간결한 표현식 형태로 작성하는 방식이다.
함수를 값처럼 다룰 수 있으며, 주로 한 번 사용하고 버리는 짧은 로직에 사용된다.

람다식의 공통적인 특징은 다음과 같다.

이름 없는 함수

함수를 값처럼 전달 가능

간결한 문법

일회성 로직에 적합

Java에서의 람다식
Java 람다식의 정체

Java에서 람다식은 함수가 아니라 객체이다.
정확히 말하면, Functional Interface를 구현한 익명 객체이다.

@FunctionalInterface
interface Calculator {
    int add(int a, int b);
}

Calculator c = (a, b) -> a + b;


위 람다식은 Calculator 인터페이스의 구현체로 동작한다.

왜 Java는 이런 방식으로 람다식을 만들었을까

Java는 객체지향 언어로 설계되었기 때문에 다음과 같은 제약이 있었다.

함수가 독립적인 타입이 아님

모든 실행 코드는 반드시 클래스 내부에 존재해야 함

객체지향 중심의 언어 구조

하지만 Java에서도 함수를 값처럼 사용하고 싶다는 요구가 생겼고,
기존 타입 시스템을 크게 바꾸지 않기 위해 하나의 메서드만 가진 인터페이스에 람다식을 묶는 방식을 선택했다.

이것이 Functional Interface 기반 람다식의 배경이다.

Java 람다식의 특징

반드시 Functional Interface가 필요

타입 안정성이 매우 강함

컴파일 타임에 타입 체크 가능

Stream API와 매우 잘 어울림

list.stream()
    .filter(x -> x > 10)
    .map(x -> x * 2)
    .forEach(System.out::println);

Java 람다식의 제약 사항

Java 람다식은 외부 변수를 캡처할 때 제한이 있다.

int x = 10;
x = 20; // 컴파일 오류
() -> System.out.println(x);


람다식에서 사용하는 외부 변수는 effectively final이어야 한다.

Python에서의 람다식
Python 람다식의 정체

Python에서 람다식은 진짜 함수 객체이다.

f = lambda a, b: a + b


클래스 개념 없음

인터페이스 개념 없음

일반 함수와 동일한 객체

Python 람다식 문법
lambda 매개변수들: 표현식


예시:

lambda x: x * 2


Python 람다식은 하나의 표현식만 허용한다.

Python 람다식의 사용 목적

Python의 철학은 가독성을 간결함보다 중요하게 여긴다.
그래서 람다식은 아주 짧은 함수에만 사용하도록 제한되어 있다.

조금이라도 복잡해지면 def를 사용하라는 의도가 담겨 있다.

주 사용 예시는 다음과 같다.

sorted(data, key=lambda x: x.score)
map(lambda x: x * 2, nums)
filter(lambda x: x > 10, nums)

Python 람다식의 특징

함수 객체

클로저 지원

타입 제한 없음

문법이 매우 단순

하지만 다음은 불가능하다.

여러 줄 작성

조건문이나 대입문 같은 statement 사용

Java와 Python 람다식의 철학 차이

Java
객체지향을 유지하면서 최소한으로 함수형 개념을 도입

Python
함수는 1급 객체이며, 람다는 간결한 보조 수단

JavaScript에서의 람다식
JavaScript 람다식의 개념

JavaScript에서 람다식은 **화살표 함수(Arrow Function)**이다.
람다식 개념을 JavaScript 문법에 맞게 구현한 형태이다.

(a, b) => a + b


JavaScript에서는 공식 명칭이 화살표 함수이며,
개념적으로 람다식에 해당한다.

JavaScript 화살표 함수 문법

기본 형태:

const add = (a, b) => a + b;


블록 바디:

const add = (a, b) => {
  return a + b;
};


매개변수가 하나일 때:

x => x * 2


객체를 반환할 때는 소괄호가 필요하다.

x => ({ value: x })

JavaScript 화살표 함수의 특징

화살표 함수는 함수 객체이지만, 일반 함수와 동작 방식이 다르다.

this 동작 차이
function f() {
  console.log(this);
}

const g = () => {
  console.log(this);
};


일반 함수의 this는 호출 시점에 결정된다

화살표 함수의 this는 선언 시점의 this를 고정해서 사용한다

즉, 화살표 함수는 자체적인 this를 바인딩하지 않는다.

arguments 객체 없음
const f = () => {
  console.log(arguments); // 오류
};


대신 rest parameter를 사용한다.

const f = (...args) => console.log(args);

생성자로 사용 불가
const A = () => {};
new A(); // TypeError


화살표 함수는 constructor와 prototype을 가지지 않는다.

클로저 지원
function outer() {
  let x = 10;
  return () => x++;
}


JavaScript의 람다식은 클로저 기반으로 동작한다.

Java, Python, JavaScript 람다식 비교
| 항목    | Java        | Python      | JavaScript |
| ----- | ----------- | ----------- | ---------- |
| 정체    | 인터페이스 구현 객체 | 함수 객체       | 함수 객체      |
| 문법    | (a) -> a    | lambda a: a | a => a     |
| 여러 줄  | 가능          | 불가능         | 가능         |
| this  | 객체 기준       | 없음          | 고정됨        |
| 타입    | 강타입         | 동적          | 동적         |
| 생성자   | 불가          | 불가          | 불가(화살표)    |
| 주요 용도 | Stream API  | key, map    | 콜백, 이벤트    |

JavaScript 화살표 함수 사용 주의점
사용하면 안 되는 경우

객체 메서드:

const obj = {
  value: 10,
  getValue: () => this.value
};


this는 obj를 가리키지 않는다.

올바른 방식:

const obj = {
  value: 10,
  getValue() {
    return this.value;
  }
};


DOM 이벤트 핸들러:

button.addEventListener('click', () => {
  this.classList.add('on');
});


this는 button이 아니다.

사용하기 좋은 경우

콜백 함수

map, filter, reduce

this가 필요 없는 함수

상위 this를 유지해야 할 때

실무 기준 람다식 사용 규칙
Java

짧은 동작과 Functional Interface일 때만 사용

Stream, Comparator, Runnable 등에 적합

로직이 길어지면 반드시 메서드로 분리

Python

한 줄 표현식일 때만 사용

sorted의 key, map, filter에 적합

조금이라도 복잡하면 def 사용

JavaScript

this를 사용하지 않으면 화살표 함수

this가 필요하면 function 사용

객체 메서드, DOM 이벤트, 생성자에는 화살표 함수 사용 금지

최종 요약

람다식은 언어마다 구현 방식과 철학은 다르지만,
공통적으로 짧고 일회성인 로직을 표현하기 위한 도구이다.

특히 JavaScript에서는 화살표 함수의 this 동작을 정확히 이해하는 것이 실무에서 매우 중요하다.