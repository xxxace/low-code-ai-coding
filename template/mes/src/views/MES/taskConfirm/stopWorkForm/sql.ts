export const pstaskjob_sql = `
    SELECT DISTINCT                                                                                           -- 仅添加DISTINCT聚合去除重复数据
            (SELECT ORDNO FROM ORD WHERE ORDSEQ = C.ORDSEQ)                                    ORDNO          --批号
                  , C.PMSEQ
                  , P.PMNO                                                                                    --合约号
                  , D.PSSEQ
                  , D.TSKSEQ
                  , D.JOBSEQ
                  , D.JOBNO                                                                                   --工序编码
                  , J.CNAME                                                                    V_JOBNAME      --工序名称
                  , D.QTY                                                                                     --数量
                  , D.BEGDT                                                                                   --计划开工日期
                  , D.ENDDT                                                                                   --计划完工日期
                  , D.STFG                                                                                    --状态
                  , NVL(BS1.CNAME, BS1.ENAME)                                                  V_STFGNAME     --状态名称
                  , D.STDT                                                                                    --状态日期
                  , D.STREASON                                                                                --状态原因
                  , D.STFGTYPE                                                                                --状态类型
                  , (SELECT CNAME FROM TMPL WHERE TMPLNO = D.STFGTYPE AND TMPLTY = 'STFGTYPE') V_STFGTYPENAME --状态类型名称
                  , D.STFGREQBY                                                                               --状态申请人
                  , D.STFGREQDATE                                                                             --状态申请日期
                  , D.APPROVALBY                                                                              --状态批核人
                  , D.APPROVALDATE                                                                            --状态批核日期
                  , D.ADDUSER                                                                                 --制单人
                  , D.ADDDTTM                                                                                 --制单时间
                  , D.UPDUSER                                                                                 --修改人
                  , D.UPDDTTM                                                                                 --修改时间
    FROM PSTASKORD C
       , PSTASKJOB D
       , PSDS E
       , PM P
       , JOBFLOW J
       , BSCODE BS1
    WHERE C.PSSEQ = D.PSSEQ
      AND C.TSKSEQ = D.TSKSEQ
      AND D.PSSEQ = E.PSSEQ
      AND D.TSKSEQ = E.TSKSEQ
      AND C.PMSEQ = E.PMSEQ
      AND C.PMSEQ = P.PMSEQ
      AND D.JOBNO = J.JOBNO
      AND D.STFG = BS1.CODE
`