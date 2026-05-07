소켓(Socket)과 스트림(Stream) 개념 

 

 

1. 소켓(Socket)이란?

 

소켓(Socket)은 **네트워크 통신의 양 끝점(endpoint)**이다.

프로그램이 네트워크를 통해 데이터를 주고받기 위해 사용하는 통신 창구라고 이해하면 된다.

 

쉽게 말하면,

 

소켓 = IP 주소 + 포트 번호 + 통신 방식(TCP/UDP)

 

웹 서버, 채팅, 게임, 실시간 알림처럼

네트워크 통신이 필요한 거의 모든 프로그램의 기본 요소다.

 

 

2. 소켓의 기본 역할

 

소켓은 다음 세 가지 역할을 한다.

 

    네트워크 연결 생성
    데이터 송수신
    연결 종료 관리

 

즉, 연결 → 통신 → 종료의 흐름을 담당한다.

 

 

3. 소켓 통신의 기본 구조 (Client - Server)

 

소켓 통신은 항상 클라이언트-서버 구조를 가진다.

 

 

서버(Server)

 

    특정 포트에서 대기(Listen)
    클라이언트의 연결 요청 수락(Accept)
    요청 처리 후 응답

 

 

클라이언트(Client)

 

    서버의 IP와 포트로 연결 요청
    데이터 전송 및 응답 수신

 

스트림 소켓 (Stream Socket)

 

TCP 기반 소켓


특징

    연결 지향 (Connection-oriented)
    데이터 순서 보장
    데이터 손실 시 재전송
    신뢰성 높음
    1:1 통신 구조


동작 방식

    연결 요청
    연결 수락
    데이터 송수신
    연결 종료



장점

    데이터 무결성 보장
    안정적
    대용량 전송에 적합


사용 예

    웹(HTTP)
    파일 전송
    채팅
    DB 통신

 

 

 

데이터그램 소켓 (Datagram Socket)

 

UDP 기반 소켓



특징

    비연결 지향 (Connectionless)
    데이터 순서 보장 없음
    손실 시 재전송 없음
    빠름
    1:N 통신 가능

 

 

동작 방식

 

데이터를 패킷 단위로 바로 전송한다.

 

연결 과정이 없다.

 

즉, 편지 보내듯이 그냥 던진다.

 

 

장점

 

    빠름
    지연이 적음
    실시간성에 유리

 

 

사용 예

 

    온라인 게임
    실시간 스트리밍
    화상 통화
    DNS

 
기반 프로토콜 	TCP 	UDP
연결 방식 	연결 지향 	비연결
순서 보장 	O 	X
재전송 	O 	X
속도 	상대적으로 느림 	빠름
신뢰성 	높음 	낮음
사용 예 	웹, 파일전송 	게임, 스트리밍

 

 

    스트림 소켓 = 등기 우편
        반드시 도착
        순서 보장
        느릴 수 있음
     
    데이터그램 소켓 = 일반 편지
        빠름
        분실 가능
        순서 바뀔 수 있음

 

 

 

4. TCP 소켓 동작 흐름

 

TCP 기반 소켓 통신의 전체 흐름은 다음과 같다.

 

    서버 소켓 생성
    포트 바인딩(bind)
    연결 대기(listen)
    클라이언트 연결 요청
    연결 수락(accept)
    데이터 송수신
    연결 종료

 

여기까지가 네트워크 레벨 흐름이다.

 

 

5. 소켓의 핵심: Stream 기반 통신

 

자바 소켓의 가장 중요한 특징은

데이터를 Stream 형태로 다룬다는 점이다.

 

자바에서 소켓을 통해 데이터를 읽고 쓰는 과정은 다음과 같다.

Socket → InputStream / OutputStream → Reader / Writer → Buffer

 

즉,

 

    소켓은 연결을 담당하고
    스트림은 데이터 흐름을 담당한다.

 

 

자바 소켓의 특징

 

    객체지향적인 설계
    TCP와 UDP를 클래스 레벨에서 명확히 구분
    예외 처리 필수
    Stream 기반 입출력
    멀티스레드 서버 구조에 적합

 

 

6. TCP 서버 예제

import java.net.ServerSocket;
import java.net.Socket;
import java.io.*;

public class Server {
    public static void main(String[] args) throws Exception {
        ServerSocket serverSocket = new ServerSocket(8080);
        Socket socket = serverSocket.accept();

        BufferedReader in = new BufferedReader(
            new InputStreamReader(socket.getInputStream())
        );
        BufferedWriter out = new BufferedWriter(
            new OutputStreamWriter(socket.getOutputStream())
        );

        String msg = in.readLine();
        System.out.println(msg);

        out.write("hello client\n");
        out.flush();

        socket.close();
        serverSocket.close();
    }
}

 

여기서 중요한 부분은 바로 이것이다.

socket.getInputStream()
socket.getOutputStream()

 

 

 

소켓은 결국 스트림을 통해 통신한다.

 

 

7.  TCP 클라이언트 예제

import java.net.Socket;
import java.io.*;

public class Client {
    public static void main(String[] args) throws Exception {
        Socket socket = new Socket("127.0.0.1", 8080);

        BufferedWriter out = new BufferedWriter(
            new OutputStreamWriter(socket.getOutputStream())
        );
        BufferedReader in = new BufferedReader(
            new InputStreamReader(socket.getInputStream())
        );

        out.write("hello server\n");
        out.flush();

        String response = in.readLine();
        System.out.println(response);

        socket.close();
    }
}

 

 

8. TCP vs UDP 간단 비교

TCP

 

    연결 지향
    데이터 순서 보장
    신뢰성 높음
    웹, 채팅, 파일 전송에 사용

UDP

    비연결
    빠르지만 신뢰성 낮음
    순서 보장 없음
    스트리밍, 게임에 사용

 

9. Python vs Java 소켓 비교
제공 방식 	socket 모듈 	java.net 패키지
설계 스타일 	절차적 	객체지향
코드 길이 	짧음 	상대적으로 김
학습 난이도 	낮음 	중간
멀티 클라이언트 	threading, async 	Thread, Executor
실무 활용 	프로토타입 	대규모 서버

※ 본 글은 자바 중심 설명이며 Python은 이해 보조용 비교이다.

 

10. 실무에서 소켓을 직접 쓰는 경우

 

요즘 실무에서는 보통 HTTP, WebSocket, gRPC 같은

상위 추상화 기술을 많이 사용한다.

 

하지만 다음과 같은 경우에는 직접 소켓을 다룬다.

 

    실시간 통신 서버
    게임 서버
    IoT 장비 통신
    고성능 네트워크 서버
    커스텀 프로토콜 구현

 

핵심 정리

 

    소켓은 네트워크 통신의 가장 기본 단위
    자바 소켓은 Stream 기반 구조
    소켓은 연결을 담당하고, 스트림은 데이터 흐름을 담당
    TCP와 UDP는 신뢰성과 속도의 차이
    실무에서는 상위 프로토콜을 주로 사용하지만, 기본은 결국 소켓

