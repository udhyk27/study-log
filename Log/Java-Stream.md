# Java Stream

Stream 은 데이터가 흐르는 통로이다.
- 데이터를 한 번에 읽거나 쓰지 않고 순차적으로 흘려보내는 방식이며 입출력에서 데이터 처리 단위를 추상화하여 다루기 쉽게 만든다.

특징
연속성: 데이터가 하나씩 또는 일정 단위로 순차적으로 흐름
추상화: 파일, 네트워크, 메모리 등 출처에 상관없이 동일한 방식으로 처리 가능
효율성: 한 번에 큰 데이터를 다루지 않고, 버퍼링/조각 처리 가능

### Stream의 분류
자바에서 크게 바이트 단위 / 문자 단위 / 데이터 보조 / 고수준 Stream으로 나눌 수 있다.

종류	클래스/예시	설명
바이트 기반 스트림(Byte Stream)	InputStream, OutputStream	
- 1바이트 단위로 데이터 읽기/쓰기
- 파일, 소켓 등에서 바이너리 데이터 처리에 사용

문자 기반 스트림(Character Stream)	Reader, Writer	- 2바이트 단위로 문자 처리
- 텍스트 파일 읽기/쓰기 편리
- 예: FileReader, BufferedReader

보조 스트림(Decorator / Filter Stream)	BufferedReader, BufferedWriter, DataInputStream, DataOutputStream, PrintWriter
- 기본 스트림에 기능 추가
- 버퍼링, 한 줄 읽기, 자료형 단위 입출력 등 편의 제공

바이트 ↔ 문자 변환 스트림	InputStreamReader, OutputStreamWriter	
- 바이트 스트림을 문자 스트림으로 변환
- 인코딩 처리 가능 (UTF-8, ISO-8859-1 등)

메모리 기반 스트림	ByteArrayInputStream, ByteArrayOutputStream, CharArrayReader, CharArrayWriter	
- 파일이나 소켓 없이 메모리 안에서 Stream 처리

고급 Stream / Java 8+ Stream API	java.util.stream.Stream	
- 컬렉션 데이터 처리, 필터링, 매핑, 병렬 처리 가능
- IO와 직접 관련 없지만 “데이터 흐름” 개념을 활용

### Stream 그림으로 이해
데이터 원본 (파일/소켓/메모리)
       │
       ▼
기본 스트림 (InputStream/Reader)
       │
       ▼
보조 스트림 (BufferedReader, DataInputStream 등)
       │
       ▼
처리(한 줄 읽기, 자료형 변환)


보조 스트림 = 기능 추가

기본 스트림 = 실제 입출력 담당

Java 8 Stream API = 컬렉션 처리용 데이터 흐름 추상화

### 핵심 정리

종류
바이트 스트림 → 바이너리 데이터
문자 스트림 → 텍스트 데이터
보조 스트림 → 속도/편의 기능 추가
변환 스트림 → 바이트 ↔ 문자
메모리 스트림 → 파일·소켓 없이 메모리 처리

Java 8 Stream API → 컬렉션·데이터 처리

장점
메모리 효율, 코드 간결, 데이터 처리 추상화

자바 8부터 도입되었으며 컬렉션이나 배열의 요소를 선언적 방식으로 처리하기 위해 사용된다.

Stream의 가장 큰 특징은 중간 연산과 최종 연산으로 구성된다는 점이다.
filter, map 같은 중간 연산은 Stream을 반환하며, 실제 연산은 바로 실행되지 않는다.
count, forEach, collect 같은 최종 연산이 호출되는 순간에만 연산이 수행된다. 이를 **지연 실행(Lazy Evaluation)**이라 한다.

Stream은 반복문처럼 직접 제어하지 않고, 내부에서 반복을 처리한다.
이로 인해 코드가 간결해지고, 처리하려는 의도가 명확하게 드러난다. 또한 병렬 처리로 확장하기도 쉽다.

다만 Stream은 한 번 사용하면 재사용할 수 없고, 단순한 로직에서는 오히려 가독성이 떨어질 수 있다.
따라서 Stream은 데이터 가공과 집계에 적합하며, 복잡한 흐름 제어가 필요한 경우에는 반복문이 더 적절하다.

정리하면,
Java Stream은 컬렉션 데이터를 함수형 방식으로 처리하기 위한 파이프라인 구조의 API이다.



### 기본 구조
1. FIFO(First in First out) 구조 (큐)
2. 단방향(입력 스트림은 읽기만 하고 출력 스트림은 쓰기만 한다.)

### 종류
Byte 계열 스트림과 Character 계열 스트림으로 나뉜다.

Byte 계열 스트림(음성, 영상 데이터)
- 입력 : InputStream - read()
- 출력 : OutputStream - write()

Character 계열 스트림 (문자 기반 데이터)
- 입력 : Render - read()
- 출력 : Writer - write()





Stream 미사용
int count = 0;
for (int value : array) {
    if (value > 10) {
        count++;
    }
}

Stream 사용
long count = Arrays.stream(array)
                   .filter(value -> value > 10)
                   .count();
// .count() 는 long형 결과 배출




# Socket


>> https://hayden-archive.tistory.com/107
https://www.elancer.co.kr/blog/detail/255
https://blog.naver.com/seban21/70093245393
https://astor-dev.com/blog/posts/627810608397422592/
