Migration이란

데이터베이스가 테이블과 컬럼을 만들 때 phpmyadmin이나 SQL Developer 같은 프로그램을 사용해서 만드는데 라라벨에서는 프로그램 사용없이 테이블을 만들 수 있는 기능을 제공한다.
그 기능이 Migration(마이그레이션)이다.
database / migrations 아래로 가보면 4개의 마이그레이션이 미리 만들어져 있다.(라라벨8 기준) 

마이그레이션 파일 내용
up() : php artisan migrate 칠 때 실행되는 명령어

down() : php artisan migrate:rollback 칠 때 실행되는 명령어

Schema::create('users', function (Blueprint $table) {
    $table->id();
    $table->string('name');
    $table->string('email')->unique();
    $table->timestamp('email_verified_at')->nullable();
    $table->string('password');
    $table->rememberToken();
    $table->timestamps();
});
users라는 이름의 table을 만든다.

안에 있는 내용은 테이블의 컬럼.

$table->timestamps(); : create

Schema::dropIfExists('users');
'users' 테이블을 삭제한다.

 

마이그레이션 명령어
마이그레이션 생성

php artisan make:migration 마이그레이션명
 

마이그레이션 실행

php artisan migrate
 

직전 마이그레이션으로 되돌아가기 

php artisan migrate:rollback
 

모든 마이그레이션을 없애기(데이터베이스 초기화)

php artisan migrate:reset
 

migrate:reset 한후 처음 기본으로 제공됐던 마이그레이션 실행

php artisan migrate:refresh
 

마이그레이션 테이블


마이그레이션한 내용을 보여준다.

batch는 마이그레이션한(migrate명령 치는것) 순서이다.