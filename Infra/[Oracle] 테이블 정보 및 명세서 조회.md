

-- 테이블 인덱스, COMMENT 조회
SELECT a.table_name
     , a.index_name
     , a.column_name
     , b.comments
FROM all_ind_columns a
   , all_col_comments b
WHERE a.table_name = 'T_USER'
  AND a.table_owner = b.owner
  AND a.table_name = b.table_name
  AND a.column_name = b.column_name
ORDER BY a.index_name
       , a.column_position

-- 스키마 내의 테이블 조회
SELECT * FROM TABS;

-- 테이블 행 조회
SELECT * FROM COLS WHERE TABLE_NAME=T_NOTICE;

-- 시퀀스 유무 조회
SELECT SEQUENCE_NAME
FROM USER_SEQUENCES
WHERE SEQUENCE_NAME = T_NOTICE_SEQ;







-- 테이블 명세서 조회 쿼리
SELECT
    tc.comments AS table_comment,      -- 테이블 코멘트
    c.table_name,                      -- 실제 테이블명
    c.column_name,
    colc.comments AS column_comment,   -- 🔥 컬럼 코멘트(여기 추가)

    c.data_type ||
        CASE
            WHEN c.data_type IN ('VARCHAR2','NVARCHAR2','CHAR')
                THEN '(' || c.data_length || ')'
            WHEN c.data_type = 'NUMBER' AND c.data_precision IS NOT NULL
                THEN '(' || c.data_precision || ',' || c.data_scale || ')'
        END AS data_type,

    -- PK 여부
    CASE WHEN pk.column_name IS NOT NULL THEN 'Y' ELSE 'N' END AS pk_flag,

    -- FK 여부
    CASE WHEN fk.column_name IS NOT NULL THEN 'Y' ELSE 'N' END AS fk_flag,

    -- UNIQUE 여부
    CASE WHEN uq.column_name IS NOT NULL THEN 'Y' ELSE 'N' END AS unique_flag,

    -- NULL 가능 여부
    CASE WHEN c.nullable = 'N' THEN 'N' ELSE 'Y' END AS null_flag,

    -- INDEX 여부
    CASE WHEN idx.column_name IS NOT NULL THEN 'Y' ELSE 'N' END AS index_flag

FROM
    user_tab_columns c
    LEFT JOIN user_tab_comments tc
           ON c.table_name = tc.table_name

    -- 컬럼 코멘트 JOIN
    LEFT JOIN user_col_comments colc
           ON c.table_name = colc.table_name
          AND c.column_name = colc.column_name

    -- PK
    LEFT JOIN (
        SELECT acc.table_name, acc.column_name
        FROM user_constraints ac
        JOIN user_cons_columns acc ON ac.constraint_name = acc.constraint_name
        WHERE ac.constraint_type = 'P'
    ) pk ON pk.table_name = c.table_name AND pk.column_name = c.column_name

    -- FK
    LEFT JOIN (
        SELECT acc.table_name, acc.column_name
        FROM user_constraints ac
        JOIN user_cons_columns acc ON ac.constraint_name = acc.constraint_name
        WHERE ac.constraint_type = 'R'
    ) fk ON fk.table_name = c.table_name AND fk.column_name = c.column_name

    -- UNIQUE
    LEFT JOIN (
        SELECT acc.table_name, acc.column_name
        FROM user_constraints ac
        JOIN user_cons_columns acc ON ac.constraint_name = acc.constraint_name
        WHERE ac.constraint_type = 'U'
    ) uq ON uq.table_name = c.table_name AND uq.column_name = c.column_name

    -- INDEX
    LEFT JOIN (
        SELECT ui.table_name, uic.column_name
        FROM user_indexes ui
        JOIN user_ind_columns uic ON ui.index_name = uic.index_name
    ) idx ON idx.table_name = c.table_name AND idx.column_name = c.column_name

ORDER BY
    c.table_name, c.column_id;