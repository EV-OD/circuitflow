* Library of Transformer Models for ngspice
* Location: transformers.mod

* ============================================================
* 1. NORMAL TWO-WINDING TRANSFORMER
* Pins: 1,2 (Primary) | 3,4 (Secondary)
* ============================================================
.subckt xfmr_normal p1 p2 s1 s2
.param Lp=100m  Ls=100m  Kcoeff=0.999

L_pri p1 p2 {Lp}
L_sec s1 s2 {Ls}
K_main L_pri L_sec {Kcoeff}
.ends xfmr_normal

* ============================================================
* 2. CENTER-TAPPED TRANSFORMER
* Pins: 1,2 (Primary) | 3 (Sec Top), 4 (Center Tap), 5 (Sec Bottom)
* ============================================================
.subckt xfmr_ct p1 p2 s_top s_tap s_bot
.param Lp=100m  Ls_half=25m  Kcoeff=0.999

* Primary Winding
L1 p1 p2 {Lp}

* Secondary Windings (Two halves)
L2 s_top s_tap {Ls_half}
L3 s_tap s_bot {Ls_half}

* Mutual Coupling between all coils
K12 L1 L2 {Kcoeff}
K13 L1 L3 {Kcoeff}
K23 L2 L3 {Kcoeff}
.ends xfmr_ct