# [Java] 예외 처리 코드

예외 처리(Exception Handling)

 

예외(Exception) 란 프로그램 실행 중 발생할 수 있는 오류 상황을 말한다.

 

예외 처리를 하지 않으면 프로그램은 비정상 종료되며, 이는 사용자 경험과 시스템 안정성에 큰 문제를 일으킨다.

자바는 예외를 처리하기 위해 try-catch-finally 블록, throw와 throws 키워드, 그리고 사용자 정의 예외(Custom Exception) 등을 제공한다.

 

2026.01.30 - [노트/Core] - [Java] 에러와 예외의 차이점
 

[Java] 에러와 예외의 차이점

오류(Error)는 시스템이 종료될 정도로 심각하여 프로그램에서 수습할 수 없는 문제이다. 개발자가 사전에 예측하여 방지하기 어렵다.예외(Exception)는 개발자가 작성한 로직에서 발생할 수 있는

udhyk05.tistory.com

try-catch-finally

 

예외가 발생할 가능성이 있는 코드는 try 블록 안에 작성하며, 예외가 발생하면 catch 블록에서 이를 처리한다. 또한 finally 블록은 예외 발생 여부와 관계없이 항상 실행되며, 주로 자원 해제나 마무리 작업을 수행하는 데 사용된다.

public class Exception {
    public static void main(String[] args) {
        try {
            // 0으로 나누기 → ArithmeticException 발생
            int result = 10 / 0;
            System.out.println("결과: " + result); // 이 코드는 실행되지 않음
        } catch (ArithmeticException e) {
            // 예외가 발생하면 이 블록 실행
            System.out.println("예외 발생: 0으로 나눌 수 없습니다.");
        } finally {
            // 예외 발생 여부와 상관없이 항상 실행
            System.out.println("finally 블록: 자원 정리 가능");
        }
    }
}

    실행 결과

    예외 발생: 0으로 나눌 수 없습니다.
    finally 블록: 자원 정리 가능

멀티 catch

 

여러 catch 블록을 | 기호를 사용하여 하나의 catch 블록으로 합칠 수 있으며, 합칠 수 있는 예외의 개수에는 제한이 없다. 하지만 멀티 catch는 여러 예외를 한꺼번에 처리하기 때문에, 각 예외마다 개별적인 처리가 필요하다면 catch문을 여러 번 작성하여 예외 유형별로 분기 처리하는 것이 좋다.

import java.io.*;
import java.sql.*;

public class MultiCatch {
    public static void main(String[] args) {
        try {
            // 파일 읽기와 데이터베이스 작업 예시
            FileReader fr = new FileReader("data.txt");
            Connection conn = DriverManager.getConnection("jdbc:mydb", "user", "pass");
        } catch (IOException | SQLException e) {
            // IOException과 SQLException을 동일하게 처리
            e.printStackTrace();
        }
    }
}

throw

 

throw는 개발자가 의도적으로 예외를 발생시킬 때 사용한다. 잘못된 입력이나 비정상적인 상태에서 기본 예외나 사용자 정의 예외를 발생시킬 수 있다.

public class ThrowExample {
    public static void main(String[] args) {
        int age = -5;

        try {
            if (age < 0) {
                // 개발자가 의도적으로 예외 발생
                throw new IllegalArgumentException("나이는 0 이상이어야 합니다.");
            }
            System.out.println("나이: " + age);
        } catch (IllegalArgumentException e) {
            System.out.println("예외 발생: " + e.getMessage());
        }
    }
}

    실행 결과

    예외 발생: 나이는 0 이상이어야 합니다.

예외 메시지 출력

 

자바에서 예외가 발생하면, 개발자는 예외 메시지를 출력하여 문제의 원인을 확인할 수 있다.

모든 예외 클래스는 Throwable 클래스를 상속받기 때문에, 이 클래스에 정의된 getMessage()나 printStackTrace() 같은 메서드를 사용할 수 있다.

    getMessage() → 예외 발생 시 설정된 메시지만 반환
    printStackTrace() → 예외 발생 위치와 프로그램 내부 요소까지 포함한 스택 정보 전체를 콘솔에 출력

printStackTrace()는 출력문 없이도 자동으로 콘솔에 표시되므로, 디버깅 시 매우 유용하다.

하지만 이 스택 정보에는 시스템 구조, 파일 경로, 클래스명 등 민감한 정보가 포함될 수 있으므로, 실제 운영 환경에서는 일반 사용자에게 그대로 노출하지 않고 관리자만 확인할 수 있도록 주의해야 한다.

catch (Exception e) {
    System.out.println(e.getMessage()); // 예외 메시지
    e.printStackTrace();                 // 호출 스택 출력
}

사용자 정의 예외 처리 (Custom Excecption)

 

 

필요에 따라 개발자가 직접 예외 클래스를 만들어서 특정 상황에서 의미 있는 예외를 발생시킬 수 있다.

주로 비즈니스 로직이나 프로그램 특수 상황을 명확하게 표현하고, 호출자에게 예외를 전달할 때 사용된다.

 

    사용자 정의 예외는 Exception 또는 RuntimeException을 상속받아 만들 수 있다.
    Checked Exception으로 만들면 반드시 try-catch로 처리하거나 throws로 호출자에게 전달해야 한다.
    Unchecked Exception으로 만들면 선택적으로 처리할 수 있다.

// 사용자 정의 런타임 예외
class InvalidUserException extends RuntimeException {
    public InvalidUserException(String message) {
        super(message);
    }
}

public class ExceptionEx {
    public static void main(String[] args) {
        throw new InvalidUserException("유효하지 않은 사용자");
    }
}


도메인에 맞는 예외를 정의하면 코드의 의도가 명확해진다.

예외 처리의 중요성

 

자바 예외 처리(Exception Handling)는 프로그램 실행 중 발생할 수 있는 예상치 못한 오류로 인한 비정상 종료를 방지하고, 안정적인 실행 상태를 유지하기 위한 핵심 기술이다.

 

try-catch-finally와 throw 등을 활용해 오류를 처리하면 시스템의 영속성을 보장하고, 발생한 예외를 기록하여 디버깅과 유지보수를 용이하게 만들 수 있다. 또한 외부 연동 장애나 예기치 못한 오류가 발생하더라도 전체 시스템 부하를 최소화하여 서비스 안정성을 높이는 데 중요한 역할을 한다.

 

예외 처리를 통해 개발자는 문제 상황에 빠르게 대응하고 시스템의 신뢰성을 높일 수 있다.