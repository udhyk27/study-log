# [Java] 에러와 예외의 차이

오류(Error)는 시스템이 종료될 정도로 심각하여 프로그램에서 수습할 수 없는 문제이다. 개발자가 사전에 예측하여 방지하기 어렵다.


예외(Exception)는 개발자가 작성한 로직에서 발생할 수 있는 실수나, 사용자의 잘못된 입력 등으로 발생하는 문제이다. 적절한 예외 처리(Exception Handling)를 통해 개발자가 사전에 예측하여 프로그램이 정상적으로 동작하도록 대응할 수 있다.

    오류와 예외의 상속 관계


Java에서 Error와 Exception은 모두 Throwable 클래스를 상속 받는다. 
Throwable은 Java 최상위 클래스인 Object를 기반으로 만들어진 클래스이며, 오류와 예외 정보를 담고있다. 
또한 예외가 다른 예외와 연결될 때(Chained Exception) 연결된 예외 정보도 기록할 수 있다.

Throwable 주요 메서드는 getMessage()와 printStackTrace()가 있는데 이를 통해 Error와 Exception 상황에서 오류 코드를 콘솔창에 나타낼 수 있다.

getMessage(): 오류나 예외 메시지를 반환
printStackTrace(): 예외 발생 시 호출 스택 정보를 콘솔에 출력

public class Main {
    public static void main(String[] args) {
        try {
            int result = 10 / 0; // ArithmeticException 발생
        } catch (ArithmeticException e) {
            System.out.println("예외 메시지: " + e.getMessage());
            e.printStackTrace(); // 호출 스택 출력
        }
    }
}

에러(Error)의 종류

Error는 Throwable의 하위 클래스로, 애플리케이션이 catch해서 처리하려고 해서는 안 되는 심각한 문제를 의미한다. 대부분의 Error는 비정상적인 상태를 나타내며, ThreadDeath 에러는 정상적인 상황일 수 있음에도 불구하고 일반적으로 catch해서는 안 되기 때문에 Error의 하위 클래스로 분류된다.

메서드는 실행 중에 발생할 수 있지만 catch되지 않은 Error의 하위 클래스들을 throws 절에 선언할 필요가 없다. Error가 정상적인 프로그램 흐름에서 발생해서는 안 되는 상황이기 때문이다.

따라서 Error와 그 하위 클래스들은 컴파일 시 unchecked exception으로 취급된다.


컴파일 에러(Compile-time Error)

    코드를 컴파일할 때 발생한다.
    주로 문법 오류, 타입 불일치, 선언되지 않은 변수 사용 등에서 발생한다.
    프로그램이 아예 실행되지 않고, 수정해야 컴파일이 완료된다.

런타임 에러(Runtime Error)

    프로그램 실행 중에 발생하는 에러 
    0으로 나누기(ArithmeticException), 배열 인덱스 초과(ArrayIndexOutOfBoundsException) 등 
    실행 중이므로, 프로그램 도중 예외 처리를 통해 대응할 수 있다. 

논리적 에러(Logical Error)

    문법상 문제는 없지만, 프로그램이 의도와 다르게 동작하는 경우 
    평균을 구할 때 합계를 잘못 계산하거나, 조건문을 잘못 작성하는 경우
    컴파일도 통과하고 실행도 되지만, 결과가 기대와 다르게 나오는 경우 

    컴파일 에러 → 코드가 아예 안 돌아감
    런타임 에러 → 실행 중에 터짐
    논리적 에러 → 실행은 되지만 결과가 이상함 

예외(Exception)의 종류

자바 공식문서에서는 RuntimeException과 CheckedException을 다음과 같이 분류하고 있다.

Exception 클래스와 그 서브클래스 중에서 RuntimeException 계열이 아닌 것들은 모두 Checked Exception이다. 체크드 예외는 메서드나 생성자의 실행 도중 발생할 수 있고, 그 예외가 메서드나 생성자 밖으로 전달될 수 있다면, 해당 메서드나 생성자의 throws 절에 반드시 선언하거나 try-catch 구문으로 처리해야 한다.


Checked Exception (체크 예외)

    컴파일 시점에 처리 여부를 반드시 확인해야 하는 예외
    예외 처리를 하지 않으면 컴파일이 되지 않는다. 
    try-catch 또는 throws 처리가 필수이다.
    IOException, SQLException, ClassNotFoundException, FileNotFoundException 등

import java.io.FileReader;
import java.io.IOException;

public class Main {
    public static void main(String[] args) {
        try {
            FileReader reader = new FileReader("test.txt");
        } catch (IOException e) {
            System.out.println("파일 읽기 실패: " + e.getMessage());
        }
    }
}



Unchecked Exception (RuntimeException) 

    컴파일러가 처리 여부를 강제하지 않는다. 
    실행 중 발생하며, 대부분 프로그래머 실수로 발생한다.
    NullPointerException, ArithmeticException, ArrayIndexOutOfBoundsException, IllegalArgumentException  등

public class Main {
    public static void main(String[] args) {
        String text = null;
        System.out.println(text.length()); // NullPointerException
    }
}

 
구분 	Checked 	Unchecked
체크 시점 	컴파일 	런타임
처리 강제 	O 	X
상속 	Exception 	RuntimeException
원인 	외부 요인 	코드 오류

명시적 예외 처리

 

Checked / Unchecked  Exception의 가장 핵심적인 차이는 명시적 예외처리 여부이다. Checked Exception은 체크 하는 시점이 컴파일 단계이기 때문에, 별도의 예외 처리를 하지 않는다면 컴파일 자체가 되지 않는다. Checked Exception이 발생할 가능성이 있는 메소드라면 반드시 로직을 try - catch로 감싸거나 throws로 던져서 처리해야 한다. 

반면 Unchecked Exception의 경우는 명시적인 예외 처리를 하지 않아도 된다. 충분한 주의를 기울이면 미리 회피할 수 있는 경우가 대부분이기 때문에 자바 컴파일러는 별도의 예외 처리를 요구하지 않도록 설계 되어 있다. 따라서 에러를 일으키는 코드가 있더라도 try - catch 처리하지 않더라도 컴파일도 되고 실행까지 가능하다.

자주 발생하는 예외
NullPointerException 	null 객체를 참조하려 했을 때 발생
ArithmeticException 	잘못된 산술 연산을 수행했을 때 발생
ArrayIndexOutOfBoundsException 	배열의 범위를 벗어난 인덱스에 접근했을 때 발생
ClassCastException 	객체를 잘못된 타입으로 형변환하려 할 때 발생
IOException 	입출력 처리 과정에서 오류가 발생했을 때 발생
SQLException 	데이터베이스 접근 또는 SQL 실행 중 오류가 발생했을 때 발생
ClassNotFoundException 	클래스를 찾지 못했을 때 발생
FileNotFoundException 	파일을 찾지 못했을 때 발생
IllegalArgumentException
	메서드에 잘못된 인자가 전달되었을 때 발생