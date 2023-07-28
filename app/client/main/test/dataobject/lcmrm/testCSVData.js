const csvData = 'Samples,,H3K9 substrate,H3K9 internal_standard,H3K9 product\r\nName,Pos.,Area,Area,Area\r\nW000124518_001,a1,52105,99085,824\r\nW000124518_002,a2,56024,102312,812\r\nW000124518_003,a3,51894,94735,960\r\nW000124518_004,a4,48687,89360,1351\r\nW000124518_005,a5,49230,91987,2845\r\nW000124518_006,a6,51018,96726,6211\r\nW000124518_007,a7,62330,116077,18858\r\nW000124518_008,a8,58445,102234,46977\r\nW000124518_009,a9,58022,90668,94470\r\nW000124518_010,a10,51121,76537,171256\r\nW000124518_011,a11,61216,84178,227438\r\nW000124518_012,a12,56520,78061,221036\r\nW000124518_013,a13,60230,113712,7508\r\nW000124518_014,a14,63229,117328,11410\r\nW000124518_015,a15,61458,109575,23776\r\nW000124518_016,a16,44058,64998,30248\r\nW000124518_017,a17,60901,92765,83003\r\nW000124518_018,a18,60364,87971,143523\r\nW000124518_019,a19,54805,71574,160553\r\nW000124518_020,a20,62006,85460,224847\r\nW000124518_021,a21,65537,82414,233795\r\nW000124518_022,a22,64796,83269,232593\r\nW000124518_023,a23,67121,86826,228580\r\nW000124518_024,a24,68846,87542,226010\r\nW000124518_025,b1,52777,86193,3231\r\nW000124518_026,b2,56195,102243,2071\r\nW000124518_027,b3,56998,93580,28269\r\nW000124518_028,b4,55555,92163,45217\r\nW000124518_029,b5,56726,82854,119946\r\nW000124518_030,b6,59145,76040,125951\r\nW000124518_031,b7,55865,73299,162283\r\nW000124518_032,b8,57248,71079,207464\r\nW000124518_033,b9,54968,63642,187078\r\nW000124518_034,b10,54642,66095,199595\r\nW000124518_035,b11,61912,72962,214038\r\nW000124518_036,b12,59460,70410,210789\r\nW000124518_047,b23,67973,77770,233030\r\nW000124518_048,b24,68293,81783,230208\r\nW000124518_049,c1,61759,99675,3690\r\nW000124518_050,c2,61941,99903,2102\r\nW000124518_051,c3,61124,89375,23937\r\nW000124518_052,c4,55791,75390,40902\r\nW000124518_053,c5,55900,75905,77714\r\nW000124518_054,c6,53487,62799,132639\r\nW000124518_055,c7,54170,67336,185565\r\nW000124518_056,c8,55136,62058,193391\r\nW000124518_057,c9,48385,62283,198049\r\nW000124518_058,c10,51071,59238,189361\r\nW000124518_059,c11,51989,60641,207321\r\nW000124518_060,c12,47963,59490,184795\r\nW000124518_071,c23,58935,72476,227975\r\nW000124518_072,c24,58479,73023,214879\r\nW000124518_073,d1,52313,79955,3483\r\nW000124518_074,d2,55917,82752,2008\r\nW000124518_075,d3,56111,79112,11055\r\nW000124518_076,d4,52808,78289,21780\r\nW000124518_077,d5,52111,70731,30583\r\nW000124518_078,d6,51806,68545,62779\r\nW000124518_079,d7,56117,69024,109547\r\nW000124518_080,d8,56676,60446,150398\r\nW000124518_081,d9,49169,57281,162262\r\nW000124518_082,d10,50968,57827,178771\r\nW000124518_083,d11,55935,62122,209608\r\nW000124518_084,d12,50345,57042,192092\r\nW000124518_095,d23,59473,62465,199345\r\nW000124518_096,d24,59796,67045,251649\r\nW000124518_097,e1,60963,87779,3758\r\nW000124518_098,e2,59940,78924,1886\r\nW000124518_099,e3,58935,74001,19227\r\nW000124518_100,e4,57259,67425,32856\r\nW000124518_101,e5,63296,68196,67495\r\nW000124518_102,e6,63110,61743,109827\r\nW000124518_103,e7,45924,42270,107685\r\nW000124518_104,e8,62635,60510,183302\r\nW000124518_105,e9,57224,52411,161106\r\nW000124518_106,e10,56432,54967,162366\r\nW000124518_107,e11,57276,61072,186569\r\nW000124518_108,e12,64575,64269,200570\r\nW000124518_119,e23,55154,56447,172726\r\nW000124518_120,e24,63790,69686,199478\r\nW000124518_121,f1,58223,73176,3195\r\nW000124518_122,f2,53806,65746,1705\r\nW000124518_123,f3,55620,68672,16700\r\nW000124518_124,f4,51412,61904,24384\r\nW000124518_125,f5,56973,63759,40513\r\nW000124518_126,f6,50372,57533,77554\r\nW000124518_127,f7,52761,54759,119509\r\nW000124518_128,f8,49394,54760,146828\r\nW000124518_129,f9,46385,50631,147052\r\nW000124518_130,f10,51010,53779,164454\r\nW000124518_131,f11,50201,53451,170862\r\nW000124518_132,f12,49184,56338,181598\r\nW000124518_143,f23,52804,56443,170426\r\nW000124518_144,f24,54184,57346,173811\r\nW000124518_145,g1,48542,65410,2925\r\nW000124518_146,g2,51436,71414,1768\r\nW000124518_147,g3,53265,57220,16185\r\nW000124518_148,g4,44761,55947,29847\r\nW000124518_149,g5,50728,61514,57595\r\nW000124518_150,g6,48317,54963,106289\r\nW000124518_151,g7,52511,52098,134149\r\nW000124518_152,g8,51639,49384,146247\r\nW000124518_153,g9,58028,56673,172200\r\nW000124518_154,g10,54600,50485,153379\r\nW000124518_155,g11,56227,55923,168978\r\nW000124518_156,g12,61049,57714,174689\r\nW000124518_167,g23,58589,57700,184558\r\nW000124518_168,g24,62727,60619,190398\r\nW000124518_169,h1,62911,73340,3303\r\nW000124518_170,h2,56244,61997,1667\r\nW000124518_171,h3,53528,55762,64270\r\nW000124518_172,h4,54119,53885,101066\r\nW000124518_173,h5,52872,51716,132239\r\nW000124518_174,h6,51901,49305,143494\r\nW000124518_175,h7,51033,52146,136102\r\nW000124518_176,h8,52544,52658,164963\r\nW000124518_177,h9,54089,50426,156163\r\nW000124518_178,h10,54010,50748,157171\r\nW000124518_179,h11,59719,53650,167587\r\nW000124518_180,h12,51600,51059,165946\r\nW000124518_191,h23,53191,54794,177076\r\nW000124518_192,h24,57377,55939,179570\r\nW000124518_193,i1,55346,64459,2945\r\nW000124518_194,i2,51402,61955,1781\r\nW000124518_195,i3,54416,60275,18649\r\nW000124518_196,i4,47024,48033,30072\r\nW000124518_197,i5,50264,51159,62563\r\nW000124518_198,i6,54814,51160,103442\r\nW000124518_199,i7,48761,47316,126774\r\nW000124518_200,i8,51315,47545,142825\r\nW000124518_201,i9,49371,46330,147967\r\nW000124518_202,i10,51510,53047,169444\r\nW000124518_203,i11,49223,44485,150964\r\nW000124518_204,i12,47951,46647,159271\r\nW000124518_215,i23,51407,47705,155398\r\nW000124518_216,i24,52566,54308,176955\r\nW000124518_217,j1,47199,49818,2573\r\nW000124518_218,j2,50519,48215,1503\r\nW000124518_239,j23,47918,50413,165479\r\nW000124518_240,j24,55692,51985,170730\r\nW000124518_241,k1,53021,62419,2540\r\nW000124518_242,k2,54144,64197,1625\r\nW000124518_263,k23,55248,51424,157105\r\nW000124518_264,k24,55259,53464,152695\r\nW000124518_265,l1,54215,55798,2339\r\nW000124518_266,l2,44505,39538,1047\r\nW000124518_287,l23,54887,50690,154288\r\nW000124518_288,l24,59676,52130,157032\r\nW000124518_289,m1,59306,57507,2245\r\nW000124518_290,m2,50760,50124,1211\r\nW000124518_311,m23,57521,51026,147037\r\nW000124518_312,m24,55676,49339,145869\r\nW000124518_313,n1,53641,50355,2174\r\nW000124518_314,n2,50310,48566,1263\r\nW000124518_335,n23,60283,50204,149328\r\nW000124518_336,n24,54671,49873,141895\r\nW000124518_337,o1,58120,56810,2160\r\nW000124518_338,o2,55330,54059,1195\r\nW000124518_359,o23,57453,50092,147733\r\nW000124518_360,o24,59408,50006,139896\r\nW000124518_361,p1,52950,46931,2121\r\nW000124518_362,p2,55436,49861,1256\r\nW000124518_383,p23,52695,43395,127772\r\nW000124518_384,p24,55502,47218,131551';

export default csvData;