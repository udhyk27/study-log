Java 제네릭 타입 소거와 오버로딩, 왜 Object 메서드가 선택될까?

정보처리기사 실기 문제를 풀다가 조금 헷갈리는 문제가 하나 있었습니다.

제네릭 클래스 안에서 T value를 오버로딩된 메서드에 전달했는데, 실제 객체는 Integer임에도 print(Object)가 호출되는 문제였습니다.

해설에는 “타입 소거(Type Erasure) 때문”이라고 되어 있었지만, 정확히 왜 그런지 이해가 잘 되지 않았습니다.

그래서 코드를 직접 작성해서 확인해봤습니다.

문제 코드

class Printer {
    void print(Integer a) {
        System.out.println("Integer");
    }
    void print(Object a) {
        System.out.println("Object"); // 실행됨
    }
    void print(Number a) {
        System.out.println("Number");
    }
}
class Main {
    public static void main(String[] args) {
        new Collection<>(0).print();
    }
    public static class Collection<T> {
        T value;
        public Collection(T t) {
            value = t;
            System.out.println("생성자 t : " + t.getClass().getName());
            System.out.println("생성자 value : " + value.getClass().getName());
        }
        public void print() {
            System.out.println("value1 : " + value.getClass().getName());
            new Printer().print(value);
            System.out.println("value2 : " + value.getClass().getName());
        }
    }
}

실행 결과는 다음과 같았습니다.

생성자 t : java.lang.Integer
생성자 value : java.lang.Integer
value1 : java.lang.Integer
Object
value2 : java.lang.Integer

value.getClass()는 계속 Integer를 출력하는데, 메서드는 print(Object)가 호출됩니다.

처음에는 “실행 시점에 Integer인 걸 알 텐데 왜 Object가 호출되지?“라는 의문이 들었습니다.

원인

핵심은 오버로딩은 컴파일 시점에 결정된다는 점입니다.

메서드를 선택할 때는 실제 객체 타입이 아니라 변수의 선언 타입을 기준으로 판단합니다.

Collection<T> 안에서 value의 선언 타입은 T입니다.

그런데 제네릭은 컴파일 과정에서 타입 소거(Type Erasure)가 발생합니다.

별도의 상한을 지정하지 않은 T는 컴파일러가 Object로 취급합니다.

즉 컴파일러가 보는 코드는 사실상 아래와 비슷한 형태가 됩니다.

Object value;
new Printer().print(value);

이 상태에서는 print(Object)가 가장 적합한 메서드이므로 컴파일 단계에서 이미 print(Object) 호출이 결정됩니다.

반면 런타임에서 value.getClass()가 Integer를 반환하는 것은 실제 저장된 객체가 Integer이기 때문입니다.

하지만 메서드 선택은 이미 끝난 상태이므로 실행 중에 다시 Integer 버전으로 바뀌지는 않습니다.

정말 컴파일 시점에 결정될까?

직접 확인해보기 위해 바이트코드를 확인해봤습니다.

javac Main.java
javap -c Main\$Collection

print() 메서드를 보면 다음과 같이 출력됩니다.

invokevirtual Printer.print:(Ljava/lang/Object;)V

컴파일 과정에서 이미 print(Object)를 호출하도록 바이트코드가 생성된 것을 확인할 수 있습니다.

실행 시에는 JVM이 이 바이트코드를 그대로 수행하기 때문에 실제 객체가 Integer여도 print(Object)가 호출됩니다.

해결 방법

1. 명시적으로 캐스팅

new Printer().print((Integer) value);

컴파일러가 Integer 타입으로 인식하기 때문에 print(Integer)가 호출됩니다.

2. 제네릭 상한 지정

class Collection<T extends Number>

이 경우 타입 소거 후 T는 Number가 되므로,

new Printer().print(value);

는 print(Number)를 호출하게 됩니다.

정리

이번 문제를 풀면서 가장 헷갈렸던 부분은 실제 객체는 Integer인데 왜 Object 메서드가 호출되는가였습니다.

직접 코드를 작성하고 바이트코드까지 확인해보니 이유는 생각보다 단순했습니다.

오버로딩은 런타임 객체 타입이 아니라 컴파일 시점의 선언 타입을 기준으로 메서드를 선택합니다.

그리고 제네릭은 타입 소거가 발생하기 때문에 T는 Object로 취급되고, 결국 print(Object)가 선택됩니다.

정보처리기사에서는 단순히 “타입 소거 때문이다.” 정도로 넘어갈 수 있는 내용이지만, 이번 기회에 컴파일 과정까지 직접 확인해보면서 제네릭과 오버로딩이 어떻게 동작하는지 조금 더 명확하게 이해할 수 있었습니다.