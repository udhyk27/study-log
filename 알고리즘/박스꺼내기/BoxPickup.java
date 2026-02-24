// 프로그래머스 - 택배 상자 꺼내기
class BoxPickup {
    public int solution(int n, int w, int num) {

        int rows = (n + w - 1) / w;
        int[][] boxes = new int[rows][w];

        int value = 1;

        // 상자 쌓기
        for (int i = 0; i < rows; i++) {
            if (i % 2 == 0) {
                for (int j = 0; j < w && value <= n; j++) {
                    boxes[i][j] = value++;
                }
            } else {
                for (int j = w - 1; j >= 0 && value <= n; j--) {
                    boxes[i][j] = value++;
                }
            }
        }

        // num 위치 찾기
        int targetRow = 0, targetCol = 0;
        for (int i = 0; i < rows; i++) {
            for (int j = 0; j < w; j++) {
                if (boxes[i][j] == num) {
                    targetRow = i;
                    targetCol = j;
                }
            }
        }

        // 위에 있는 상자 개수
        int answer = 0;
        for (int i = targetRow; i < rows; i++) {
            if (boxes[i][targetCol] != 0) {
                answer++;
            }
        }

        return answer;
    }
}