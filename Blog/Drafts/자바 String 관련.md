---
notion_page_id: 36181856-910c-81e2-99b8-c5831ed5b95b
---
# Java String, StringBuffer, StringBuilder 차이점

Java에서 문자열을 다룰 때 흔히 사용하는 클래스는 `String`, `StringBuffer`, `StringBuilder`가 있습니다.

처음 Java를 배우면 모두 문자열을 다루는 것처럼 보이지만, 내부 동작 방식과 성능, 사용 목적에는 차이가 있습니다.

이번 글에서는 각각의 특징과 차이점, 그리고 실무에서는 어떤 것을 주로 사용하는지 정리해보겠습니다.

---

# 1. String이란?

`String`은 Java에서 가장 기본적으로 사용하는 문자열 클래스입니다.

예를 들어 아래처럼 문자열을 선언할 수 있습니다.

```java
String str = "Hello";
```

문자열을 가장 쉽게 다룰 수 있기 때문에 Java에서 가장 많이 사용됩니다.

하지만 `String`에는 중요한 특징이 있습니다.

## String은 불변 객체(Immutable)

`String`은 한 번 생성되면 내부 값을 변경할 수 없습니다.

예를 들어 아래 코드를 보겠습니다.

```java
String str = "Hello";

str += " World";

System.out.println(str);
```

겉보기에는 문자열이 수정된 것처럼 보입니다.

하지만 실제 내부 동작은 다릅니다.

```text
"Hello"
↓ 새 객체 생성
"Hello World"
```

기존 문자열을 수정하는 것이 아니라 새로운 문자열 객체를 생성합니다.

즉, 문자열 변경이 발생할 때마다 새로운 객체가 생성됩니다.

---

# 2. String의 성능 문제

문자열을 몇 번 수정하는 정도는 문제가 되지 않습니다.

하지만 반복문에서 문자열을 계속 더하는 경우 성능 문제가 발생할 수 있습니다.

예를 들어:

```java
String str = "";

for(int i = 0; i < 10000; i++) {
    str += i;
}
```

위 코드는 반복할 때마다 새로운 `String` 객체를 생성합니다.

```text
""
→ "0"
→ "01"
→ "012"
→ "0123"
...
```

객체 생성이 반복되기 때문에 메모리 사용량과 성능이 비효율적일 수 있습니다.

이 문제를 해결하기 위해 등장한 것이 `StringBuffer`, `StringBuilder`입니다.

---

# 3. StringBuffer란?

`StringBuffer`는 문자열을 수정할 수 있는(Mutable) 클래스입니다.

즉, 새로운 객체를 계속 생성하지 않고 기존 객체 내부에서 문자열을 변경합니다.

예시:

```java
StringBuffer sb = new StringBuffer();

sb.append("Hello");
sb.append(" ");
sb.append("World");

System.out.println(sb.toString());
```

출력:

```text
Hello World
```

### 특징

- 가변 객체(Mutable)
- 문자열 수정 가능
- `append()` 사용
- Thread Safe
- synchronized 기반 동기화 지원

---

# 4. StringBuilder란?

`StringBuilder`는 `StringBuffer`와 거의 동일합니다.

사용 방식도 같습니다.

예시:

```java
StringBuilder sb = new StringBuilder();

sb.append("Hello");
sb.append(" ");
sb.append("World");

System.out.println(sb.toString());
```

출력:

```text
Hello World
```

### 특징

- 가변 객체(Mutable)
- 문자열 수정 가능
- `append()` 사용
- synchronized 제거
- 더 빠른 성능

---

# 5. synchronized란?

`synchronized`는 여러 스레드가 동시에 접근할 때 데이터를 안전하게 보호하는 기능입니다.

쉽게 말하면:

> 한 번에 한 명만 사용하게 잠금을 거는 것

예를 들어 공용 화장실을 생각하면 쉽습니다.

한 사람이 사용 중이면 잠금(lock)이 걸려 다른 사람이 들어오지 못합니다.

이런 방식으로 데이터 충돌을 방지합니다.

---

# 6. Thread Safe란?

Thread Safe란

> 여러 스레드가 동시에 접근해도 안전한 상태

를 의미합니다.

### StringBuffer

`StringBuffer`는 내부 메서드에 `synchronized`가 적용되어 있습니다.

예시 개념:

```java
public synchronized StringBuffer append(String str)
```

즉, 동시에 접근해도 안전합니다.

### StringBuilder

반면 `StringBuilder`는 동기화가 없습니다.

```java
public StringBuilder append(String str)
```

속도는 빠르지만 멀티스레드 환경에서는 안전하지 않을 수 있습니다.

---

# 7. String vs StringBuffer vs StringBuilder 비교

| 구분 | String | StringBuffer | StringBuilder |
|---|---|---|---|
| 변경 가능 여부 | X (Immutable) | O | O |
| 객체 생성 | 새 객체 생성 | 기존 객체 수정 | 기존 객체 수정 |
| 속도 | 느림 | 보통 | 빠름 |
| 동기화 | X | O | X |
| Thread Safe | X | O | X |
| 사용 목적 | 일반 문자열 | 멀티스레드 환경 | 일반적인 문자열 조합 |

---

# 8. 실무에서는 왜 StringBuilder를 더 많이 사용할까?

많은 사람들이 궁금해하는 부분입니다.

`StringBuffer`가 더 안전한데 왜 `StringBuilder`를 사용할까요?

이유는 대부분 상황에서 **동기화가 필요 없기 때문**입니다.

예를 들어 Spring 서버에서 API 요청이 들어왔다고 가정해보겠습니다.

```java
public String createMessage() {

    StringBuilder sb = new StringBuilder();

    sb.append("Hello");
    sb.append(" API");

    return sb.toString();
}
```

위 코드는 요청마다 새로운 객체가 생성됩니다.

즉:

```text
사용자 A 요청 → thread1
사용자 B 요청 → thread2
```

각 스레드가 자기 객체만 사용합니다.

서로 공유하지 않기 때문에 충돌이 발생하지 않습니다.

이 상황에서 `synchronized`는 오히려 성능 비용만 증가시킵니다.

그래서 실무에서는 대부분 `StringBuilder`를 사용합니다.

---

# 9. 실무 사용 예시

## SQL 문자열 조립

```java
StringBuilder sql = new StringBuilder();

sql.append("SELECT * ");
sql.append("FROM USER ");
sql.append("WHERE ID = ?");
```

---

## 로그 문자열 생성

```java
StringBuilder log = new StringBuilder();

log.append("UserId: ");
log.append(userId);
```

---

## 반복 문자열 생성

```java
StringBuilder sb = new StringBuilder();

for(int i = 0; i < 1000; i++) {
    sb.append(i);
}
```

---

# 10. 언제 무엇을 써야 할까?

## String

문자열 수정이 거의 없는 경우

예:

```java
String name = "홍길동";
```

일반 문자열은 대부분 `String` 사용

---

## StringBuilder

문자열을 반복적으로 수정하는 경우

예:

```java
StringBuilder sb = new StringBuilder();
```

실무 기본값

---

## StringBuffer

멀티스레드 환경에서 공유 문자열 객체를 안전하게 다뤄야 하는 경우

다만 실무에서는 상대적으로 드물고 레거시 코드에서 자주 볼 수 있습니다.

---

# 11. 면접 / 시험 포인트

### String
- Immutable
- 문자열 변경 시 새 객체 생성

### StringBuffer
- Mutable
- synchronized
- Thread Safe

### StringBuilder
- Mutable
- 빠름
- 실무에서 많이 사용

### 핵심 차이

```text
String        = 불변
StringBuffer  = 안전하지만 느림
StringBuilder = 빠르고 실무 기본
```

---

# 마무리

정리하면 대부분 상황에서는 `StringBuilder`를 사용하는 것이 일반적입니다.

일반 문자열은 `String`을 사용하고, 문자열 수정이 반복되는 경우 `StringBuilder`를 사용하는 것이 효율적입니다.

`StringBuffer`는 멀티스레드 환경에서 안전성이 필요한 특수한 경우에 고려하면 됩니다.
