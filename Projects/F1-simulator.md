# F1 시뮬레이션

1. 데이터 수집 (크롤링)
목표: 현재 F1에서 쓰이는 트랙, 팀, 드라이버, 차량 스펙 정보를 가져오기

방법
F1 공식 사이트
 또는 위키피디아
 등에서 크롤링
Java에서는 Jsoup 라이브러리 사용 → HTML 파싱 가능

데이터 구조
class Circuit {
    String name;
    String location;
    double lengthKm;
}

class Team {
    String name;
    List<Driver> drivers;
}

class Driver {
    String name;
    double skill; // 0~100
    Car car;
}

class Car {
    String model;
    double speed; // 최고 속도
    double handling; // 코너링 능력
}

2. 서킷에서 경주 시뮬레이션
목표: 각 팀/드라이버가 트랙을 돌고 이동, 랩 기록을 실시간으로 보여줌
방법
단순화: 서킷을 거리 단위 또는 랩 단위로 나누고, 드라이버가 이동할 때마다 위치 갱신
Java 스윙(Swing) 혹은 JavaFX → GUI로 실시간 위치 표시

예시 로직

for (int lap = 1; lap <= totalLaps; lap++) {
    for (Driver d : allDrivers) {
        double progress = calculateProgress(d, currentLap);
        d.setPosition(progress);
    }
    updateGUI(allDrivers); // 화면 갱신
    Thread.sleep(500); // 실시간 느낌
}

3. 경기 결과 & 순위표
목표: 우승자 및 순위 확인

방법
각 드라이버마다 총 랩 기록 계산
랩 기록 기준으로 순위표 정렬

allDrivers.sort(Comparator.comparingDouble(Driver::getTotalTime));
printRanking(allDrivers);

4. 기능 확장 아이디어

랜덤 이벤트: 날씨, 사고 등 → 경기 변수 추가
전략 선택: 피트스톱 타이밍, 타이어 선택
다중 경기: 시즌 시뮬레이션, 포인트 합산
그래픽 강화: JavaFX + 이미지/애니메이션