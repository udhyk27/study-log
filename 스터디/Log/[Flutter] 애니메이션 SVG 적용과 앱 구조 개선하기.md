웹뷰 기반 Flutter 앱을 만들면서 애니메이션 SVG를 적용해야 하는 상황이 있었다. 처음에는 단순히 이미지 하나 넣는 정도로 생각했지만 막상 적용해 보니 생각보다 구조를 많이 건드려야 했고 그 과정에서 겪었던 문제와 해결 과정을 정리해보았다.

 

이번 프로젝트에서 사용해야 했던 리소스는 애니메이션이 포함된 SVG 파일이었다. Flutter에서는 SVG 자체는 사용할 수 있지만, 애니메이션이 들어간 SVG를 그대로 사용하는 기능은 지원하지 않는다. 일반적으로 사용하는 Flutter SVG 패키지도 정적인 SVG 렌더링만 가능하기 때문에 기존 애니메이션을 그대로 활용하기에는 한계가 있었다. 보통은 JSON 기반의 Lottie 같은 애니메이션 방식을 많이 사용하지만, 이번에는 이미 제작된 SVG를 그대로 사용해야 했기 때문에 다른 해결 방법을 고민하게 되었다.

 

처음에는 flutter native splash를 그대로 활용해서 애니메이션을 넣어보려고 했지만 네이티브 스플래시는 애니메이션을 직접 지원하지 않는다. 그래서 UX를 크게 해치지 않는 선에서 구조를 조금 바꿨다. 네이티브 스플래시에서는 배경색만 보여주고, 그다음 화면에서 내가 만든 커스텀 스플래시를 띄워 애니메이션을 재생하도록 한 것이다. 사용자가 보기에는 하나의 스플래시처럼 자연스럽게 이어지도록 배경색을 동일하게 맞추었다.

    앱 접속 시 화면 흐름

    flutter native splash → main.dart → custom splash → home.dart

 

원래는 main 함수에서 Firebase 초기화나 Remote Config 호출 같은 무거운 작업들을 먼저 처리하고 있었는데 이 방식에서는 커스텀 스플래시가 늦게 나타나는 문제가 있었다. 사용자 입장에서는 앱이 멈춘 것처럼 느껴질 수도 있기 때문에 초기화 로직을 아예 커스텀 스플래시 위젯 내부로 이동시켰다. 앱이 실행되자마자 바로 화면을 띄우고 그 안에서 데이터를 준비하는 방식으로 구조를 바꾼 셈이다.

 

앱 시작 시 동작하는 초기화 함수는 아래와 같이 구성했다.

// Custom Splash Screen
Future<void> _initializeData() async {
    try {
      // 인터넷 연결 상태 체크
      var conn = await Connectivity().checkConnectivity();
      if (conn == ConnectivityResult.none) {
        if (!mounted) return;

        CommonDialog.networkError(context, onRetry: () {
          _initializeData();
        });
        return;
      }

      await Firebase.initializeApp(); // Firebase 초기화
      
      // 병렬 처리를 위해 묶기
      final results = await Future.wait([
        SharedPreferences.getInstance(),
        Api().getRemoteConfig(),
        Future.delayed(const Duration(milliseconds: 2500)), // 2.5초 애니메이션
      ]);

      final SharedPreferences prefs = results[0] as SharedPreferences;
      bool showOnboarding = prefs.getBool('showOnboarding') ?? false;

      if (!mounted) return;

      Navigator.of(context).pushReplacement(
        MaterialPageRoute(
          builder: (context) => showOnboarding ? const HomeScreen() : const OnboardingScreen(),
        ),
      );
    } catch (e) {
      debugPrint("초기화 에러: $e");
    }
  }

 

여기서 가장 신경 쓴 부분은 애니메이션 시간과 데이터 로딩을 동시에 처리한 부분이다. 애니메이션 길이가 약 2.5초였기 때문에 최소 시간은 유지하면서도 데이터가 아직 준비되지 않았다면 화면이 넘어가지 않도록 만들고 싶었다. 그래서 Future wait을 사용해서 SharedPreferences 로드, Remote Config 호출, 애니메이션 대기 시간을 병렬로 묶었다. 이렇게 하니 애니메이션이 너무 빨리 끝나거나 반대로 데이터 때문에 화면이 어색하게 멈추는 문제가 사라졌다.

 

애니메이션 SVG를 실제로 화면에 보여주는 방식도 고민이 많았다. 처음에는 Image asset으로 해결하려 했지만 당연히 애니메이션은 동작하지 않았다. 결국 SVG 소스를 HTML 안에 직접 넣고 WebView로 렌더링하는 방식으로 방향을 바꿨다. 웹에서는 SVG 애니메이션이 자연스럽게 동작하기 때문에 별도의 변환 작업 없이 원하는 결과를 얻을 수 있었다.
Android 12 이상 Splash 화면 이슈 해결

앱 아이콘과 스플래시 설정도 같이 정리했다. mipmap 이미지를 직접 관리하는 대신 flutter launcher icons 라이브러리를 사용해서 아이콘을 자동 생성하도록 했는데 유지보수 측면에서 훨씬 편했다. Android 12 이상에서는 스플래시 정책이 바뀌어서 추가 설정이 필요했는데 styles 파일에 아래 설정을 추가해 기본 animated icon을 제거하고 배경색만 표시하도록 했다.

<item name="android:windowSplashScreenAnimatedIcon">@android:color/transparent</item>
<item name="android:windowSplashScreenBackground">#FFFFFF</item>

Api 구조 개선 (Static → Singleton)

구조를 정리하다 보니 Api 클래스 설계도 함께 손보게 됐다. 기존에는 데이터를 static 변수로 관리하고 있어서 전역 접근은 편했지만 확장성이나 테스트 관점에서는 아쉬운 부분이 있었다. 그래서 싱글톤 패턴으로 구조를 변경했다.

  // --- 싱글톤 ---
  static final Api _instance = Api._internal();
  // → 클래스당 한 번만 생성되는 유일한 인스턴스

  factory Api() => _instance;
  // → 생성자를 factory로 만들어
  //   항상 기존 인스턴스를 반환하도록 제어

  Api._internal();
  // → 외부에서 new Api()를 막기 위한
  //   private 생성자

  // 인스턴스에 변수 저장
  String appVersion = "";
  String storeUrl = "";
  String webViewUrl = "";
  Map<String, Map<String, dynamic>> onBoardText = {};

 

다른 파일에서 사용할 때는 동일한 객체를 호출하도록 했다.

  final api = Api();
  api.onBoardText

Dart 2.0부터는 객체 생성 시 new 키워드를 생략하는 것이 표준 방식이다.

 

Static vs Singleton
항목 	Static 변수 방식 	싱글톤 방식
구조 	전역 변수 	객체지향 구조
확장성 	상속/인터페이스 어려움 	확장 가능
DI 테스트 	거의 불가능 	가능
생명주기 	앱 시작부터 메모리 점유 	메모리 필요한 시점에 Lazy 초기화 가능
해상도별 앱 아이콘 생성

앱 아이콘은 아래 사이트에서 해상도별로 mipmap 이미지를 생성할 수 있다.

나는 폴더에 직접 이미지를 넣어 세팅하는 대신 flutter_launcher_icons 라이브러리를 사용해 자동 생성했다.
 

App Icon Generator

 

www.appicon.co

이렇게 바꾸고 나니 어디서든 같은 인스턴스를 사용하면서도 객체지향 구조를 유지할 수 있었고 이후 기능을 확장하기도 훨씬 수월해졌다. Dart에서는 new 키워드를 생략하는 것이 일반적이기 때문에 Api 객체도 간결하게 사용할 수 있었다.

 

이번 작업을 하면서 단순히 애니메이션 하나를 넣는다고 끝나는 게 아니라 앱 시작 구조 자체를 다시 설계하게 된 느낌이었다. 특히 무거운 초기화 로직을 main에서 분리하고 커스텀 스플래시 내부로 이동시킨 부분은 체감 성능에도 꽤 큰 영향을 줬다. 사용자 입장에서는 앱이 더 빠르게 실행되는 것처럼 느껴졌고, 나 역시 스플래시 화면의 역할을 다시 생각해 보는 계기가 되었다.