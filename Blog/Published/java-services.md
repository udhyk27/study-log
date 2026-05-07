자바에서 Service를 인터페이스로 두고 의존하는 이유

Spring 기반 자바 프로젝트를 보면 보통 Service 계층이 인터페이스와 구현 클래스로 나뉘어 있다.

public interface OrderService {
    void order();
}

@Service
public class OrderServiceImpl implements OrderService {
    public void order() {
        // 비즈니스 로직
    }
}


그리고 이를 사용하는 쪽에서는 구현 클래스가 아니라 인터페이스에 의존한다.

@RequiredArgsConstructor
public class OrderController {
    private final OrderService orderService;
}


처음 이 구조를 접하면 자연스럽게 이런 의문이 든다.
Repository는 그냥 클래스처럼 보이는데 왜 Service만 인터페이스를 두는지,
상속해서 쓰면 안 되는 건지 헷갈리기 쉽다.

이 구조의 핵심 이유는 Service의 성격에 있다.

Service는 정책이고 구현은 언제든 바뀔 수 있기 때문이다.

Service는 단순한 기능 묶음이 아니라 비즈니스 규칙을 표현하는 계층이다.
중요한 것은 어떻게 구현했는지가 아니라 무엇을 하느냐다.

예를 들어 아래 인터페이스는 구현이 아니라 의미를 정의한다.

public interface PaymentService {
    void pay(int amount);
}


이 코드는 결제를 한다는 행위 자체를 표현할 뿐이다.
결제를 어떤 방식으로 처리하는지는 관심사가 아니다.

이런 행위는 상황에 따라 구현이 달라질 수 있다.

@Service
public class KakaoPayService implements PaymentService {
    public void pay(int amount) {
        // 카카오페이 결제
    }
}

@Service
public class NaverPayService implements PaymentService {
    public void pay(int amount) {
        // 네이버페이 결제
    }
}


하지만 이 서비스를 사용하는 쪽은 어떤 결제 수단인지 알 필요가 없다.

@RequiredArgsConstructor
public class OrderService {
    private final PaymentService paymentService;
}


주문 서비스 입장에서는 결제가 가능하다는 사실만 중요하다.
이 구조가 가능한 이유는 Service를 인터페이스로 분리했기 때문이다.

그렇다면 상속으로 해결할 수는 없을까라는 생각이 들 수 있다.

public class KakaoPayService extends PaymentService {
}


하지만 이 방식은 적절하지 않다.
상속은 개념적으로 같은 종류일 때 사용하는 구조다.
결제 서비스들은 같은 종류라기보다 같은 역할을 수행하는 객체들이다.
또한 상속은 구현까지 함께 묶어버리기 때문에 교체가 어렵다.

Service 계층에서는 상속보다 교체 가능성이 훨씬 중요하다.

물론 상속이 필요한 경우도 있다.
공통 흐름이 명확하고 일부 단계만 달라야 하는 경우다.

public abstract class BaseOrderService {

    public void order() {
        validate();
        doOrder();
        log();
    }

    protected abstract void doOrder();

    protected void validate() {}
    protected void log() {}
}

@Service
public class NormalOrderService extends BaseOrderService {
    protected void doOrder() {
        // 일반 주문 처리
    }
}

@Service
public class EventOrderService extends BaseOrderService {
    protected void doOrder() {
        // 이벤트 주문 처리
    }
}


이 경우에는 처리 흐름이 동일하고 구조를 강제해야 하므로 상속이 적절하다.
이 패턴은 Template Method 패턴이다.

그렇다면 Repository는 왜 인터페이스처럼 안 보일까.

Spring Data JPA를 사용하는 경우 Repository 역시 인터페이스다.

public interface OrderRepository extends JpaRepository<Order, Long> {
}


구현체는 프레임워크가 대신 만들어준다.
즉 Service는 우리가 구현을 교체하는 계층이고
Repository는 프레임워크가 구현을 교체하는 계층일 뿐이다.
의존성을 분리하는 원리는 동일하다.

Service만 인터페이스로 쓰는 것처럼 보이는 이유는 Service가 경계 계층이기 때문이다.
Controller와 Service 사이에는 비즈니스 경계가 있고
Service와 Repository 사이에는 기술 경계가 있다.

위쪽은 웹과 API
아래쪽은 데이터베이스와 외부 시스템이다.

경계에 있는 계층일수록 인터페이스로 분리할 가치가 커진다.

특히 Service에는 할인 정책, 주문 조건, 상태 전이 규칙,
외부 시스템 호출 순서 같은 비즈니스 판단이 몰린다.
이 로직들은 요구사항이 바뀌면 바로 수정된다.
이벤트 기간이나 정책 변경, 신규 기능 추가, 예외 케이스 대응이 모두 여기에 해당한다.

그래서 Service는 구조상 가장 자주 변경되는 계층이다.

변경이 잦은 계층은 구현이 아니라 역할에 의존해야 한다.

만약 Controller가 Service 구현 클래스에 직접 의존한다면

public class OrderController {
    private final OrderServiceImpl orderService;
}


구현 변경 시 영향 범위가 커지고
테스트가 어려워지며
다른 구현으로 전환하기 힘들어진다.

그래서 Controller는 Service 구현체가 아니라
Service의 역할인 인터페이스에 의존한다.

public class OrderController {
    private final OrderService orderService;
}


이 구조의 핵심은 명확하다.
Controller는 어떤 주문 서비스인지에는 관심이 없고
주문을 할 수 있다는 사실만 알면 된다.

Service를 인터페이스로 두면
비즈니스 로직이 변경되어도 Controller 코드는 수정하지 않아도 되고
구현 교체는 설정이나 주입 변경만으로 가능하며
테스트 시에는 Mock Service를 쉽게 주입할 수 있다.

결국 인터페이스 의존의 목적은
변경이 잦은 비즈니스 로직을
시스템의 나머지 부분으로부터 격리하는 데 있다.