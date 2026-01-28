'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

const INITIAL_LAYERS = [
  {
    id: 'face',
    type: 'face',
    d: 'M541 197 L542 196 L581 196 L582 197 L599 197 L600 198 L609 198 L610 199 L618 199 L619 200 L626 200 L627 201 L633 201 L634 202 L639 202 L640 203 L646 203 L647 204 L652 204 L653 205 L657 205 L658 206 L662 206 L663 207 L667 207 L668 208 L671 208 L672 209 L675 209 L676 210 L679 210 L680 211 L683 211 L684 212 L687 212 L688 213 L690 213 L691 214 L694 214 L695 215 L697 215 L698 216 L700 216 L701 217 L704 217 L705 218 L707 218 L708 219 L710 219 L711 220 L713 220 L714 221 L716 221 L717 222 L719 222 L720 223 L722 223 L723 224 L725 224 L726 225 L728 225 L729 226 L731 226 L732 227 L733 227 L734 228 L736 228 L737 229 L738 229 L739 230 L741 230 L742 231 L744 231 L745 232 L746 232 L747 233 L748 233 L749 234 L751 234 L752 235 L753 235 L754 236 L755 236 L756 237 L757 237 L758 238 L760 238 L761 239 L762 239 L763 240 L764 240 L765 241 L766 241 L767 242 L768 242 L769 243 L770 243 L771 244 L773 244 L774 245 L775 245 L776 246 L777 246 L778 247 L779 247 L780 248 L781 248 L782 249 L783 249 L784 250 L785 250 L786 251 L787 251 L788 252 L789 252 L790 253 L791 253 L793 255 L794 255 L795 256 L796 256 L797 257 L798 257 L799 258 L800 258 L802 260 L803 260 L804 261 L805 261 L806 262 L807 262 L809 264 L810 264 L811 265 L812 265 L814 267 L815 267 L816 268 L817 268 L819 270 L820 270 L821 271 L822 271 L824 273 L825 273 L827 275 L828 275 L830 277 L831 277 L833 279 L834 279 L836 281 L837 281 L840 284 L841 284 L843 286 L844 286 L847 289 L848 289 L850 291 L851 291 L854 294 L855 294 L858 297 L859 297 L863 301 L864 301 L869 306 L870 306 L874 310 L875 310 L880 315 L881 315 L890 324 L891 324 L892 325 L892 326 L893 326 L919 352 L919 353 L929 363 L929 364 L933 368 L933 369 L939 375 L939 376 L943 380 L943 381 L947 385 L947 386 L950 389 L950 390 L952 392 L952 393 L955 396 L955 397 L958 400 L958 401 L960 403 L960 404 L963 407 L963 408 L965 410 L965 411 L967 413 L967 414 L969 416 L969 417 L971 419 L971 420 L972 421 L972 422 L974 424 L974 425 L976 427 L976 428 L977 429 L977 430 L979 432 L979 433 L980 434 L980 435 L982 437 L982 438 L983 439 L983 440 L985 442 L985 443 L986 444 L986 445 L987 446 L987 447 L988 448 L988 449 L990 451 L990 452 L991 453 L991 454 L992 455 L992 456 L993 457 L993 458 L994 459 L994 460 L995 461 L995 462 L996 463 L996 464 L997 465 L997 466 L998 467 L998 468 L999 469 L999 470 L1000 471 L1000 472 L1001 473 L1001 474 L1002 475 L1002 476 L1003 477 L1003 478 L1004 479 L1004 481 L1005 482 L1005 483 L1006 484 L1006 485 L1007 486 L1007 487 L1008 488 L1008 489 L1009 490 L1009 492 L1010 493 L1010 494 L1011 495 L1011 497 L1012 498 L1012 499 L1013 500 L1013 501 L1014 502 L1014 504 L1015 505 L1015 507 L1016 508 L1016 509 L1017 510 L1017 512 L1018 513 L1018 515 L1019 516 L1019 518 L1020 519 L1020 521 L1021 522 L1021 523 L1022 524 L1022 526 L1023 527 L1023 529 L1024 530 L1024 532 L1025 533 L1025 535 L1026 536 L1026 538 L1027 539 L1027 541 L1028 542 L1028 545 L1029 546 L1029 548 L1030 549 L1030 552 L1031 553 L1031 555 L1032 556 L1032 559 L1033 560 L1033 563 L1034 564 L1034 567 L1035 568 L1035 571 L1036 572 L1036 576 L1037 577 L1037 581 L1038 582 L1038 585 L1039 586 L1039 591 L1040 592 L1040 596 L1041 597 L1041 602 L1042 603 L1042 608 L1043 609 L1043 615 L1044 616 L1044 622 L1045 623 L1045 631 L1046 632 L1046 641 L1047 642 L1047 655 L1048 656 L1048 709 L1047 710 L1047 723 L1046 724 L1046 733 L1045 734 L1045 742 L1044 743 L1044 749 L1043 750 L1043 756 L1042 757 L1042 762 L1041 763 L1041 768 L1040 769 L1040 773 L1039 774 L1039 778 L1038 779 L1038 783 L1037 784 L1037 788 L1036 789 L1036 793 L1035 794 L1035 797 L1034 798 L1034 801 L1033 802 L1033 805 L1032 806 L1032 808 L1031 809 L1031 812 L1030 813 L1030 816 L1029 817 L1029 819 L1028 820 L1028 822 L1027 823 L1027 825 L1026 826 L1026 828 L1025 829 L1025 831 L1024 832 L1024 835 L1023 836 L1023 837 L1022 838 L1022 840 L1021 841 L1021 843 L1020 844 L1020 846 L1019 847 L1019 849 L1018 850 L1018 851 L1017 852 L1017 854 L1016 855 L1016 857 L1015 858 L1015 860 L1014 861 L1014 862 L1013 863 L1013 865 L1012 866 L1012 867 L1011 868 L1011 870 L1010 871 L1010 872 L1009 873 L1009 874 L1008 875 L1008 876 L1007 877 L1007 879 L1006 880 L1006 881 L1005 882 L1005 883 L1004 884 L1004 885 L1003 886 L1003 887 L1002 888 L1002 889 L1001 890 L1001 892 L1000 893 L1000 894 L999 895 L999 896 L998 897 L998 898 L997 899 L997 900 L996 901 L996 902 L995 903 L995 904 L994 905 L994 906 L993 907 L993 908 L992 909 L992 910 L991 911 L991 912 L989 914 L989 915 L988 916 L988 917 L987 918 L987 919 L986 920 L986 921 L984 923 L984 924 L983 925 L983 926 L981 928 L981 929 L980 930 L980 931 L979 932 L979 933 L977 935 L977 936 L975 938 L975 939 L974 940 L974 941 L972 943 L972 944 L971 945 L971 946 L969 948 L969 949 L967 951 L967 952 L965 954 L965 955 L963 957 L963 958 L960 961 L960 962 L958 964 L958 965 L955 968 L955 969 L952 972 L952 973 L950 975 L950 976 L946 980 L946 981 L943 984 L943 985 L939 989 L939 990 L934 995 L934 996 L928 1002 L928 1003 L919 1012 L919 1013 L894 1038 L893 1038 L893 1039 L892 1040 L891 1040 L882 1049 L881 1049 L875 1055 L874 1055 L870 1059 L869 1059 L865 1063 L864 1063 L860 1067 L859 1067 L856 1070 L855 1070 L851 1074 L850 1074 L848 1076 L847 1076 L844 1079 L843 1079 L841 1081 L840 1081 L838 1083 L837 1083 L835 1085 L834 1085 L832 1087 L831 1087 L829 1089 L828 1089 L826 1091 L825 1091 L823 1093 L822 1093 L820 1095 L819 1095 L818 1096 L817 1096 L815 1098 L814 1098 L813 1099 L812 1099 L810 1101 L809 1101 L808 1102 L807 1102 L805 1104 L804 1104 L803 1105 L802 1105 L801 1106 L800 1106 L799 1107 L798 1107 L796 1109 L795 1109 L794 1110 L793 1110 L792 1111 L791 1111 L790 1112 L789 1112 L788 1113 L787 1113 L785 1115 L784 1115 L783 1116 L782 1116 L781 1117 L780 1117 L779 1118 L778 1118 L777 1119 L776 1119 L775 1120 L774 1120 L773 1121 L772 1121 L771 1122 L769 1122 L768 1123 L767 1123 L766 1124 L765 1124 L764 1125 L764 1125 L763 1126 L762 1126 L761 1127 L760 1127 L759 1128 L758 1128 L757 1129 L756 1129 L755 1130 L754 1130 L753 1131 L752 1131 L751 1132 L750 1132 L749 1133 L748 1133 L747 1134 L746 1134 L745 1135 L744 1135 L743 1136 L742 1136 L741 1137 L740 1137 L739 1138 L738 1138 L737 1139 L736 1139 L735 1140 L734 1140 L733 1141 L732 1141 L731 1142 L730 1142 L729 1143 L728 1143 L727 1144 L726 1144 L725 1145 L724 1145 L723 1146 L722 1146 L721 1147 L720 1147 L719 1148 L718 1148 L717 1149 L716 1149 L715 1150 L714 1150 L713 1151 L712 1151 L711 1152 L710 1152 L709 1153 L708 1153 L707 1154 L706 1154 L705 1155 L704 1155 L703 1156 L702 1156 L701 1157 L700 1157 L699 1158 L698 1158 L697 1159 L696 1159 L695 1160 L694 1160 L693 1161 L692 1161 L691 1162 L690 1162 L689 1163 L688 1163 L687 1164 L686 1164 L685 1165 L684 1165 L683 1166 L682 1166 L681 1167 L680 1167 L679 1168 L678 1168 L677 1169 L513 1169 L512 1168 L511 1168 L510 1167 L509 1167 L508 1166 L507 1166 L506 1165 L505 1165 L504 1164 L503 1164 L502 1163 L501 1163 L500 1162 L499 1162 L498 1161 L497 1161 L496 1160 L495 1160 L494 1159 L493 1159 L492 1158 L491 1158 L490 1157 L489 1157 L488 1156 L487 1156 L486 1155 L485 1155 L484 1154 L483 1154 L482 1153 L481 1153 L480 1152 L479 1152 L478 1151 L477 1151 L476 1150 L475 1150 L474 1149 L473 1149 L472 1148 L471 1148 L470 1147 L469 1147 L468 1146 L467 1146 L466 1145 L465 1145 L464 1144 L463 1144 L462 1143 L461 1143 L460 1142 L459 1142 L458 1141 L457 1141 L456 1140 L455 1140 L454 1139 L453 1139 L452 1138 L451 1138 L450 1137 L449 1137 L448 1136 L447 1136 L446 1135 L445 1135 L444 1134 L443 1134 L442 1133 L441 1133 L440 1132 L439 1132 L438 1131 L437 1131 L436 1130 L435 1130 L434 1129 L433 1129 L432 1128 L431 1128 L430 1127 L429 1127 L428 1126 L427 1126 L426 1125 L425 1125 L424 1124 L423 1124 L422 1123 L421 1123 L420 1122 L419 1122 L418 1121 L417 1121 L416 1120 L415 1120 L414 1119 L413 1119 L412 1118 L411 1118 L410 1117 L409 1117 L408 1116 L407 1116 L406 1115 L405 1115 L404 1114 L403 1114 L402 1113 L401 1113 L400 1112 L399 1112 L398 1111 L397 1111 L396 1110 L395 1110 L394 1109 L393 1109 L392 1108 L391 1108 L390 1107 L389 1107 L388 1106 L387 1106 L386 1105 L385 1105 L384 1104 L383 1104 L382 1103 L381 1103 L380 1102 L379 1102 L378 1101 L377 1101 L376 1100 L375 1100 L374 1099 L373 1099 L372 1098 L371 1098 L370 1097 L369 1097 L368 1096 L367 1096 L366 1095 L365 1095 L364 1094 L363 1094 L362 1093 L361 1093 L360 1092 L359 1092 L358 1091 L357 1091 L356 1090 L355 1090 L354 1089 L353 1089 L352 1088 L351 1088 L350 1087 L349 1087 L348 1086 L347 1086 L346 1085 L345 1085 L344 1084 L343 1084 L342 1083 L341 1083 L340 1082 L339 1082 L338 1081 L337 1081 L336 1080 L335 1080 L334 1079 L333 1079 L332 1078 L331 1078 L330 1077 L329 1077 L328 1076 L327 1076 L326 1075 L325 1075 L324 1074 L323 1074 L321 1072 L320 1072 L319 1071 L318 1071 L317 1070 L316 1070 L315 1069 L314 1069 L313 1068 L312 1068 L311 1067 L310 1067 L309 1066 L308 1066 L307 1065 L306 1065 L305 1064 L304 1064 L303 1063 L302 1063 L301 1062 L300 1062 L299 1061 L298 1061 L297 1060 L296 1060 L295 1059 L294 1059 L293 1058 L292 1058 L291 1057 L290 1057 L289 1056 L288 1056 L287 1055 L286 1055 L285 1054 L284 1054 L283 1053 L282 1053 L281 1052 L280 1052 L279 1051 L278 1051 L277 1050 L276 1050 L275 1049 L274 1049 L273 1048 L272 1048 L271 1047 L270 1047 L269 1046 L268 1046 L267 1045 L266 1045 L265 1044 L264 1044 L263 1043 L262 1043 L261 1042 L260 1042 L259 1041 L258 1041 L257 1040 L256 1040 L255 1039 L254 1039 L253 1038 L252 1038 L251 1037 L250 1037 L249 1036 L248 1036 L247 1035 L246 1035 L245 1034 L244 1034 L243 1033 L242 1033 L241 1032 L240 1032 L239 1031 L238 1031 L237 1030 L236 1030 L235 1029 L234 1029 L233 1028 L232 1028 L231 1027 L230 1027 L229 1026 L228 1026 L227 1025 L226 1025 L225 1024 L224 1024 L223 1023 L222 1023 L221 1022 L220 1022 L219 1021 L218 1021 L217 1020 L216 1020 L215 1019 L214 1019 L213 1018 L212 1018 L211 1017 L210 1017 L209 1016 L208 1016 L207 1015 L206 1015 L205 1014 L204 1014 L203 1013 L202 1013 L201 1012 L200 1012 L199 1011 L198 1011 L197 1010 L196 1010 L195 1009 L194 1009 L193 1008 L192 1008 L191 1007 L190 1007 L189 1006 L188 1006 L187 1005 L186 1005 L185 1004 L184 1004 L183 1003 L182 1003 L181 1002 L180 1002 L179 1001 L178 1001 L177 1000 L176 1000 L175 999 L174 999 L173 998 L172 998 L171 997 L170 997 L169 996 L168 996 L167 995 L166 995 L165 994 L164 994 L163 993 L162 993 L161 992 L160 992 L159 991 L158 991 L157 990 L156 990 L155 989 L154 989 L153 988 L152 988 L151 987 L150 987 L149 986 L148 986 L147 985 L146 985 L145 984 L144 984 L143 983 L142 983 L141 982 L140 982 L139 981 L138 981 L137 980 L136 980 L135 979 L134 979 L133 978 L132 978 L131 977 L130 977 L129 976 L128 976 L127 975 L126 975 L125 974 L124 974 L123 973 L122 973 L121 972 L120 972 L119 971 L118 971 L117 970 L116 970 L115 969 L114 969 L113 968 L112 968 L111 967 L110 967 L109 966 L108 966 L107 965 L106 965 L105 964 L104 964 L103 963 L102 963 L101 962 L100 962 L99 961 L98 961 L97 960 L96 960 L95 959 L94 959 L93 958 L92 958 L91 957 L90 957 L89 956 L88 956 L87 955 L86 955 L85 954 L84 954 L83 953 L82 953 L81 952 L80 952 L79 951 L78 951 L77 950 L76 950 L75 949 L74 949 L73 948 L72 948 L71 947 L70 947 L69 946 L68 946 L67 945 L66 945 L65 944 L64 944 L63 943 L62 943 L61 942 L60 942 L59 941 L58 941 L57 940 L56 940 L55 939 L54 939 L53 938 L52 938 L51 937 L50 937 L49 936 L48 936 L47 935 L46 935 L45 934 L44 934 L43 933 L42 933 L41 932 Z',
    color: '#00e5ff',
    finish: 'solid',
    strokeWidth: 4,
    x: 0,
    y: 0,
    scale: 1,
    rotation: 0
  },
  {
    id: 'eyeL',
    type: 'eye',
    d: 'M318 405 L317 406 L313 406 L312 407 L310 407 L309 408 L307 408 L306 409 L304 409 L303 410 L302 410 L301 411 L299 411 L298 412 L297 412 L295 414 L294 414 L293 415 L292 415 L291 416 L290 416 L287 419 L286 419 L284 421 L283 421 L281 423 L280 423 L276 427 L275 427 L270 432 L269 432 L257 444 L257 445 L252 450 L252 451 L249 454 L249 455 L246 458 L246 459 L244 461 L244 462 L242 464 L242 465 L240 467 L240 468 L238 470 L238 471 L237 472 L237 473 L236 474 L236 475 L235 476 L235 477 L233 479 L233 480 L232 481 L232 482 L231 483 L231 485 L230 486 L230 487 L229 488 L229 489 L228 490 L228 492 L227 493 L227 494 L226 495 L226 497 L225 498 L225 499 L224 500 L224 502 L223 503 L223 505 L222 506 L222 509 L221 510 L221 512 L220 513 L220 516 L219 517 L219 520 L218 521 L218 525 L217 526 L217 531 L216 532 L216 540 L215 541 L215 563 L216 564 L216 572 L217 573 L217 578 L218 579 L218 582 L219 583 L219 586 L220 587 L220 589 L221 590 L221 593 L222 594 L222 595 L223 596 L223 598 L224 599 L224 601 L225 602 L225 603 L226 604 L226 605 L227 606 L227 608 L228 609 L228 610 L229 611 L229 612 L230 613 L230 614 L231 615 L231 616 L232 617 L232 618 L233 619 L233 620 L234 621 L234 622 L235 623 L235 624 L236 625 L236 626 L237 627 L237 628 L239 630 L239 631 L240 632 L240 633 L242 635 L242 636 L244 638 L244 639 L246 641 L246 642 L248 644 L248 645 L250 647 L250 648 L253 651 L253 652 L256 655 L256 656 L260 660 L260 661 L271 672 L271 673 L276 678 L277 678 L284 685 L285 685 L288 688 L289 688 L292 691 L293 691 L296 694 L297 694 L299 696 L300 696 L301 697 L302 697 L304 699 L305 699 L306 700 L307 700 L308 701 L309 701 L310 702 L311 702 L312 703 L314 703 L315 704 L316 704 L317 705 L319 705 L320 706 L322 706 L323 707 L326 707 L327 708 L332 708 L333 709 L345 709 L346 708 L348 708 L349 707 L351 707 L352 706 L353 706 L354 705 L355 705 L356 704 L357 704 L359 702 L360 702 L369 693 L369 692 L372 689 L372 688 L375 685 L375 684 L376 683 L376 682 L377 681 L377 680 L379 678 L379 677 L380 676 L380 675 L381 674 L381 673 L382 672 L382 670 L383 669 L383 668 L384 667 L384 666 L385 665 L385 663 L386 662 L386 661 L387 660 L387 658 L388 657 L388 655 L389 654 L389 653 L390 652 L390 650 L391 649 L391 646 L392 645 L392 643 L393 642 L393 639 L394 638 L394 636 L395 635 L395 632 L396 631 L396 627 L397 626 L397 622 L398 621 L398 617 L399 616 L399 610 L400 609 L400 603 L401 602 L401 595 L402 594 L402 584 L403 583 L403 570 L404 569 L404 527 L403 526 L403 514 L402 513 L402 505 L401 504 L401 498 L400 497 L400 492 L399 491 L399 486 L398 485 L398 482 L397 481 L397 478 L396 477 L396 474 L395 473 L395 471 L394 470 L394 468 L393 467 L393 465 L392 464 L392 462 L391 461 L391 460 L390 459 L390 457 L389 456 L389 455 L388 454 L388 453 L387 452 L387 450 L386 449 L386 448 L385 447 L385 446 L384 445 L384 444 L382 442 L382 441 L381 440 L381 439 L379 437 L379 436 L378 435 L378 434 L375 431 L375 430 L369 424 L369 423 L367 421 L366 421 L361 416 L360 416 L357 413 L356 413 L355 412 L354 412 L352 410 L351 410 L350 409 L348 409 L347 408 L346 408 L345 407 L342 407 L341 406 L338 406 L337 405 Z',
    color: '#0a0a0a',
    finish: 'solid',
    strokeWidth: 4,
    x: 0,
    y: 0,
    scale: 1,
    rotation: 0
  },
  {
    id: 'eyeR',
    type: 'eye',
    d: 'M726 396 L725 397 L719 397 L718 398 L715 398 L714 399 L711 399 L710 400 L708 400 L707 401 L706 401 L705 402 L704 402 L703 403 L702 403 L701 404 L699 404 L697 406 L696 406 L695 407 L694 407 L693 408 L692 408 L690 410 L689 410 L687 412 L686 412 L682 416 L681 416 L677 420 L676 420 L668 428 L667 428 L663 432 L663 433 L654 442 L654 443 L650 447 L650 448 L647 451 L647 452 L644 455 L644 456 L643 457 L643 458 L640 461 L640 462 L639 463 L639 464 L637 466 L637 467 L635 469 L635 470 L634 471 L634 472 L633 473 L633 474 L631 476 L631 477 L630 478 L630 479 L629 480 L629 481 L628 482 L628 483 L627 484 L627 485 L626 486 L626 487 L625 488 L625 490 L624 491 L624 492 L623 493 L623 495 L622 496 L622 497 L621 498 L621 500 L620 501 L620 503 L619 504 L619 505 L618 506 L618 508 L617 509 L617 512 L616 513 L616 515 L615 516 L615 518 L614 519 L614 522 L613 523 L613 526 L612 527 L612 531 L611 532 L611 537 L610 538 L610 544 L609 545 L609 558 L608 559 L608 566 L609 567 L609 579 L610 580 L610 586 L611 587 L611 591 L612 592 L612 595 L613 596 L613 598 L614 599 L614 602 L615 603 L615 605 L616 606 L616 608 L617 609 L617 611 L618 612 L618 613 L619 614 L619 616 L620 617 L620 618 L621 619 L621 621 L622 622 L622 623 L623 624 L623 625 L624 626 L624 627 L625 628 L625 629 L626 630 L626 632 L628 634 L628 635 L629 636 L629 637 L630 638 L630 639 L632 641 L632 642 L633 643 L633 644 L635 646 L635 647 L637 649 L637 650 L639 652 L639 653 L642 656 L642 657 L645 660 L645 661 L649 665 L649 666 L664 681 L665 681 L670 686 L671 686 L674 689 L675 689 L678 692 L679 692 L681 694 L682 694 L683 695 L684 695 L686 697 L687 697 L688 698 L689 698 L690 699 L691 699 L692 700 L693 700 L694 701 L695 701 L696 702 L697 702 L698 703 L700 703 L701 704 L703 704 L704 705 L706 705 L707 706 L710 706 L711 707 L714 707 L715 708 L720 708 L721 709 L736 709 L737 708 L740 708 L741 707 L743 707 L744 706 L746 706 L747 705 L748 705 L749 704 L750 704 L751 703 L752 703 L753 702 L754 702 L757 699 L758 699 L771 686 L771 685 L774 682 L774 681 L776 679 L776 678 L778 676 L778 675 L779 674 L779 673 L780 672 L780 671 L782 669 L782 668 L783 667 L783 666 L784 665 L784 664 L785 663 L785 662 L786 661 L786 660 L787 659 L787 658 L788 657 L788 655 L789 654 L789 653 L790 652 L790 650 L791 649 L791 647 L792 646 L792 644 L793 643 L793 642 L794 641 L794 638 L795 637 L795 635 L796 634 L796 631 L797 630 L797 628 L798 627 L798 624 L799 623 L799 620 L800 619 L800 616 L801 615 L801 611 L802 610 L802 606 L803 605 L803 600 L804 599 L804 593 L805 592 L805 585 L806 584 L806 575 L807 574 L807 557 L808 556 L808 531 L807 530 L807 514 L806 513 L806 504 L805 503 L805 497 L804 496 L804 491 L803 490 L803 486 L802 485 L802 481 L801 480 L801 477 L800 476 L800 473 L799 472 L799 469 L798 468 L798 466 L797 465 L797 463 L796 462 L796 459 L795 458 L795 457 L794 456 L794 454 L793 453 L793 451 L792 450 L792 449 L791 448 L791 446 L790 445 L790 444 L789 443 L789 442 L788 441 L788 440 L787 439 L787 438 L786 437 L786 436 L785 435 L785 434 L783 432 L783 431 L782 430 L782 429 L779 426 L779 425 L777 423 L777 422 L772 417 L772 416 L767 411 L766 411 L762 407 L761 407 L759 405 L758 405 L757 404 L756 404 L754 402 L753 402 L752 401 L750 401 L749 400 L748 400 L747 399 L745 399 L744 398 L741 398 L740 397 L734 397 L733 396 Z',
    color: '#0a0a0a',
    finish: 'solid',
    strokeWidth: 4,
    x: 0,
    y: 0,
    scale: 1,
    rotation: 0
  },
  {
    id: 'mouth',
    type: 'mouth',
    d: 'M467 932 L466 933 L454 933 L453 934 L445 934 L444 935 L438 935 L437 936 L432 936 L431 937 L427 937 L426 938 L422 938 L421 939 L418 939 L417 940 L414 940 L413 941 L411 941 L410 942 L408 942 L407 943 L404 943 L403 944 L402 944 L401 945 L399 945 L398 946 L396 946 L395 947 L394 947 L393 948 L391 948 L390 949 L389 949 L388 950 L387 950 L388 951 L385 951 L384 952 L383 952 L382 953 L381 953 L379 955 L378 955 L376 957 L375 957 L373 959 L372 959 L361 970 L361 971 L359 973 L359 974 L358 975 L358 976 L357 977 L357 979 L356 980 L356 982 L355 983 L355 997 L356 998 L356 1001 L357 1002 L357 1003 L358 1004 L358 1006 L359 1007 L359 1008 L360 1009 L360 1010 L362 1012 L362 1013 L363 1014 L363 1015 L368 1020 L368 1021 L372 1025 L373 1025 L377 1029 L378 1029 L380 1031 L381 1031 L383 1033 L384 1033 L386 1035 L387 1035 L388 1036 L389 1036 L391 1038 L392 1038 L393 1039 L394 1039 L395 1040 L397 1040 L398 1041 L399 1041 L400 1042 L401 1042 L402 1043 L404 1043 L405 1044 L406 1044 L407 1045 L409 1045 L410 1046 L412 1046 L413 1047 L415 1047 L416 1048 L418 1048 L419 1049 L422 1049 L423 1050 L426 1050 L427 1051 L431 1051 L432 1052 L437 1052 L438 1053 L444 1053 L445 1054 L455 1054 L456 1055 L486 1055 L487 1054 L497 1054 L498 1053 L505 1053 L506 1052 L511 1052 L512 1051 L517 1051 L518 1050 L522 1050 L523 1049 L527 1049 L528 1048 L531 1048 L532 1047 L536 1047 L537 1046 L539 1046 L540 1045 L543 1045 L544 1044 L547 1044 L548 1043 L550 1043 L551 1042 L554 1042 L555 1041 L557 1041 L558 1040 L560 1040 L561 1039 L563 1039 L564 1038 L566 1038 L567 1037 L568 1037 L569 1036 L571 1036 L572 1035 L574 1035 L575 1034 L577 1034 L578 1033 L579 1033 L580 1032 L582 1032 L583 1031 L584 1031 L585 1030 L586 1030 L587 1029 L589 1029 L590 1028 L591 1028 L592 1027 L593 1027 L594 1026 L595 1026 L596 1025 L597 1025 L598 1024 L599 1024 L600 1023 L601 1023 L602 1022 L603 1022 L605 1020 L606 1020 L607 1019 L608 1019 L610 1017 L611 1017 L612 1016 L613 1016 L615 1014 L616 1014 L619 1011 L620 1011 L623 1008 L624 1008 L633 999 L633 998 L636 995 L636 994 L637 993 L637 992 L638 991 L638 990 L639 989 L639 986 L640 985 L640 980 L639 979 L639 976 L638 975 L638 974 L636 972 L636 971 L630 965 L629 965 L626 962 L625 962 L623 960 L622 960 L620 958 L619 958 L618 957 L617 957 L616 956 L615 956 L614 955 L613 955 L612 954 L611 954 L610 953 L608 953 L607 952 L606 952 L605 951 L603 951 L602 950 L600 950 L599 949 L597 949 L596 948 L594 948 L593 947 L591 947 L590 946 L587 946 L586 945 L584 945 L583 944 L580 944 L579 943 L576 943 L575 942 L572 942 L571 941 L567 941 L566 940 L562 940 L561 939 L557 939 L556 938 L551 938 L550 937 L545 937 L544 936 L537 936 L536 935 L528 935 L527 934 L517 934 L516 933 L501 933 L500 932 Z',
    color: '#0a0a0a',
    finish: 'solid',
    strokeWidth: 4,
    x: 0,
    y: 0,
    scale: 1,
    rotation: 0
  }
];

const PALETTE = ['#ffffff', '#00e5ff', '#22d3ee', '#3b82f6', '#60a5fa', '#a78bfa', '#8b5cf6', '#f472b6', '#ec4899', '#fb7185', '#f87171', '#ef4444', '#f97316', '#f59e0b', '#fbbf24', '#fde047', '#c3ff00', '#53f900', '#34d399', '#4ade80', '#86efac', '#bbf7d0', '#fef9c3', '#fde68a', '#facc15', '#fda4af', '#fbcfe8', '#e0e7ff', '#c7d2fe'];
const FINISHES = ['solid', 'glow', 'glitter'];

export default function AvatarCustomizer({ onSave, onCancel, initialState }) {
  const [layers, setLayers] = useState(initialState?.layers || INITIAL_LAYERS);
  const [history, setHistory] = useState([initialState?.layers || INITIAL_LAYERS]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [selectedLayerId, setSelectedLayerId] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);
  const dragStart = useRef({ x: 0, y: 0 });
  const svgRef = useRef(null);

  const pushHistory = useCallback((newLayers) => {
    const nextHistory = history.slice(0, historyIndex + 1);
    nextHistory.push(newLayers);
    // Keep last 50 steps
    if (nextHistory.length > 50) nextHistory.shift();
    setHistory(nextHistory);
    setHistoryIndex(nextHistory.length - 1);
  }, [history, historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setLayers(prev);
      setHistoryIndex(historyIndex - 1);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setLayers(next);
      setHistoryIndex(historyIndex + 1);
    }
  }, [history, historyIndex]);

  const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];

  const randomizeLayer = (id) => {
    const nextLayers = layers.map(l => {
      if (l.id !== id || l.type === 'import') return l;
      const allowGlow = l.type !== 'mouth';
      const finish = allowGlow && Math.random() < 0.4 ? rand(FINISHES) : 'solid';
      const color = finish === 'glow' ? '#ffffff' : rand(PALETTE);
      return { ...l, color, finish };
    });
    setLayers(nextLayers);
    pushHistory(nextLayers);
  };

  const handleRandomizeAll = () => {
    const nextLayers = layers.map(l => {
      if (l.type === 'import') return l;
      const allowGlow = l.type !== 'mouth';
      const finish = allowGlow && Math.random() < 0.4 ? rand(FINISHES) : 'solid';
      const color = finish === 'glow' ? '#ffffff' : rand(PALETTE);
      return { ...l, color, finish };
    });
    setLayers(nextLayers);
    pushHistory(nextLayers);
  };

  const handleLayerChange = (id, updates, skipHistory = false) => {
    const nextLayers = layers.map(l => l.id === id ? { ...l, ...updates } : l);
    setLayers(nextLayers);
    if (!skipHistory) pushHistory(nextLayers);
  };

  const handleDuplicate = (id) => {
    const layer = layers.find(l => l.id === id);
    if (!layer || layer.type === 'face') return;
    const newLayer = {
      ...layer,
      id: `${layer.type}-${Date.now()}`,
      x: layer.x + 20,
      y: layer.y + 20
    };
    const nextLayers = [...layers, newLayer];
    setLayers(nextLayers);
    setSelectedLayerId(newLayer.id);
    setContextMenu(null);
    pushHistory(nextLayers);
  };

  const handleDelete = (id) => {
    if (id === 'face') return;
    const nextLayers = layers.filter(l => l.id !== id);
    setLayers(nextLayers);
    if (selectedLayerId === id) setSelectedLayerId(null);
    setContextMenu(null);
    pushHistory(nextLayers);
  };

  const handleMouseDown = (e, id) => {
    if (e.button !== 0) return;
    setSelectedLayerId(id);
    setContextMenu(null);
    if (id === 'face') return;
    setIsDragging(true);
    const point = getSVGPoint(e);
    const layer = layers.find(l => l.id === id);
    dragStart.current = { x: point.x - layer.x, y: point.y - layer.y };
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !selectedLayerId) return;
    const point = getSVGPoint(e);
    handleLayerChange(selectedLayerId, {
      x: point.x - dragStart.current.x,
      y: point.y - dragStart.current.y
    }, true); // Don't push history on every pixel moved
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      pushHistory(layers); // Push history only on mouse up
    }
  };

  const handleContextMenu = (e, id) => {
    e.preventDefault();
    setSelectedLayerId(id);
    setContextMenu({ x: e.clientX, y: e.clientY, id });
  };

  const getSVGPoint = (e) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (contextMenu) return; // Ignore keys when advanced menu is open
      
      const step = e.shiftKey ? 10 : 2;
      const scaleStep = 0.05;
      const rotateStep = 5;

      // Undo/Redo
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
        e.preventDefault();
        redo();
        return;
      }

      if (!selectedLayerId || selectedLayerId === 'face') return;

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          handleLayerChange(selectedLayerId, { y: layers.find(l => l.id === selectedLayerId).y - step });
          break;
        case 'ArrowDown':
          e.preventDefault();
          handleLayerChange(selectedLayerId, { y: layers.find(l => l.id === selectedLayerId).y + step });
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handleLayerChange(selectedLayerId, { x: layers.find(l => l.id === selectedLayerId).x - step });
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleLayerChange(selectedLayerId, { x: layers.find(l => l.id === selectedLayerId).x + step });
          break;
        case '[':
          e.preventDefault();
          handleLayerChange(selectedLayerId, { scale: Math.max(0.1, layers.find(l => l.id === selectedLayerId).scale - scaleStep) });
          break;
        case ']':
          e.preventDefault();
          handleLayerChange(selectedLayerId, { scale: layers.find(l => l.id === selectedLayerId).scale + scaleStep });
          break;
        case '{':
          e.preventDefault();
          handleLayerChange(selectedLayerId, { rotation: (layers.find(l => l.id === selectedLayerId).rotation - rotateStep + 360) % 360 });
          break;
        case '}':
          e.preventDefault();
          handleLayerChange(selectedLayerId, { rotation: (layers.find(l => l.id === selectedLayerId).rotation + rotateStep) % 360 });
          break;
        case 'Backspace':
        case 'Delete':
          e.preventDefault();
          handleDelete(selectedLayerId);
          break;
        case 'd':
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            handleDuplicate(selectedLayerId);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedLayerId, layers, undo, redo]);

  const handleImportImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const newLayer = {
        id: `import-${Date.now()}`,
        type: 'import',
        url: event.target.result,
        x: 500,
        y: 500,
        scale: 0.5,
        rotation: 0,
        color: '#ffffff',
        finish: 'solid',
        strokeWidth: 4
      };
      const nextLayers = [...layers, newLayer];
      setLayers(nextLayers);
      setSelectedLayerId(newLayer.id);
      pushHistory(nextLayers);
    };
    reader.readAsDataURL(file);
  };

  const selectedLayer = layers.find(l => l.id === selectedLayerId);

  return (
    <div className="avatar-customizer-container" style={{ position: 'relative', width: '320px', margin: '0 auto' }}>
      <div 
        className="canvas-card" 
        style={{ 
          background: 'rgba(2, 7, 10, 0.6)', 
          borderRadius: '16px', 
          border: '1px solid rgba(52, 225, 255, 0.2)',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          position: 'relative'
        }}
      >
        {/* Undo/Redo Floating UI */}
        <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', gap: '4px', zIndex: 10 }}>
          <button 
            onClick={(e) => { e.stopPropagation(); undo(); }} 
            disabled={historyIndex === 0}
            style={{ 
              width: '24px', height: '24px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)', 
              background: 'rgba(0,0,0,0.5)', color: '#fff', cursor: historyIndex === 0 ? 'default' : 'pointer',
              opacity: historyIndex === 0 ? 0.3 : 1, fontSize: '12px'
            }}
            title="Undo (Ctrl+Z)"
          >
            ⟲
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); redo(); }} 
            disabled={historyIndex === history.length - 1}
            style={{ 
              width: '24px', height: '24px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)', 
              background: 'rgba(0,0,0,0.5)', color: '#fff', cursor: historyIndex === history.length - 1 ? 'default' : 'pointer',
              opacity: historyIndex === history.length - 1 ? 0.3 : 1, fontSize: '12px'
            }}
            title="Redo (Ctrl+Y)"
          >
            ⟳
          </button>
        </div>

        <svg
          ref={svgRef}
          viewBox="0 0 1000 1000"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ width: '100%', height: '320px', touchAction: 'none', cursor: 'pointer', background: '#000' }}
          onClick={() => setContextMenu(null)}
        >
          <defs>
            <filter id="glow-fx" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="20" result="blur" />
              <feComposite in="blur" in2="SourceAlpha" operator="out" result="glow" />
              <feMerge>
                <feMergeNode in="glow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="glitter-fx">
              <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" result="noise" />
              <feColorMatrix in="noise" type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.5 0" result="sparkle" />
              <feComposite in="sparkle" in2="SourceAlpha" operator="in" />
              <feBlend in="SourceGraphic" mode="screen" />
            </filter>
            <linearGradient id="rainbow-fx" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ff0040"><animate attributeName="stop-color" values="#ff0040;#ffa600;#ffee00;#00f11d;#00a2ff;#6f4dff;#ff00b1;#ff0040" dur="3s" repeatCount="indefinite" /></stop>
              <stop offset="100%" stopColor="#ff00b1"><animate attributeName="stop-color" values="#ff00b1;#ff0040;#ffa600;#ffee00;#00f11d;#00a2ff;#6f4dff;#ff00b1" dur="3s" repeatCount="indefinite" /></stop>
            </linearGradient>
          </defs>
          
          {layers.map((layer) => (
            <g
              key={layer.id}
              transform={`translate(${layer.x}, ${layer.y}) scale(${layer.scale}) rotate(${layer.rotation}, 500, 500)`}
              onMouseDown={(e) => handleMouseDown(e, layer.id)}
              onContextMenu={(e) => handleContextMenu(e, layer.id)}
              onDoubleClick={() => randomizeLayer(layer.id)}
              style={{ cursor: layer.id === 'face' ? 'default' : 'move' }}
            >
              {layer.type === 'import' ? (
                <image href={layer.url} x="250" y="250" width="500" height="500" />
              ) : (
                <path
                  d={layer.d}
                  fill={layer.finish === 'glow' ? 'url(#rainbow-fx)' : layer.color}
                  filter={layer.finish === 'glow' ? 'url(#glow-fx)' : layer.finish === 'glitter' ? 'url(#glitter-fx)' : ''}
                  stroke="var(--line)"
                  strokeWidth={layer.strokeWidth || 4}
                  vectorEffect="non-scaling-stroke"
                  style={{ transition: 'fill 0.3s ease' }}
                />
              )}
              {selectedLayerId === layer.id && layer.id !== 'face' && (
                <rect x="0" y="0" width="1000" height="1000" fill="none" stroke="var(--accent)" strokeWidth="4" strokeDasharray="20,20" />
              )}
            </g>
          ))}
        </svg>

        {/* Action Bar */}
        <div style={{ display: 'flex', borderTop: '1px solid rgba(52, 225, 255, 0.2)', background: 'rgba(0,0,0,0.4)' }}>
          <button 
            onClick={handleRandomizeAll}
            title="Randomize All"
            style={{ flex: 1, padding: '12px', background: 'transparent', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '18px' }}
          >
            🎲
          </button>
          <label 
            title="Import Piece"
            style={{ flex: 1, padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '18px' }}
          >
            🖼️
            <input type="file" accept="image/*" onChange={handleImportImage} style={{ display: 'none' }} />
          </label>
          <button 
            onClick={() => {
              const serializer = new XMLSerializer();
              const svgString = serializer.serializeToString(svgRef.current);
              onSave(svgString, { layers });
            }}
            title="Save Avatar"
            style={{ flex: 2, padding: '12px', background: 'var(--accent)', color: '#000', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
          >
            SAVE
          </button>
          <button 
            onClick={onCancel}
            title="Cancel"
            style={{ flex: 1, padding: '12px', background: 'rgba(255,0,0,0.1)', border: 'none', color: '#ff6b6b', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Advanced Context Menu */}
      {contextMenu && selectedLayer && (
        <div 
          style={{
            position: 'fixed',
            top: Math.min(contextMenu.y, window.innerHeight - 350),
            left: Math.min(contextMenu.x, window.innerWidth - 220),
            zIndex: 10001,
            width: '200px',
            background: 'rgba(2, 7, 10, 0.95)',
            borderRadius: '12px',
            border: '1px solid var(--accent)',
            padding: '12px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.8)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--accent)' }}>
              {selectedLayer.type.toUpperCase()} {selectedLayer.id.slice(-4)}
            </span>
            <button onClick={() => setContextMenu(null)} style={{ background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}>✕</button>
          </div>

          {selectedLayer.type !== 'import' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '4px' }}>
                {PALETTE.slice(0, 12).map(c => (
                  <div 
                    key={c} 
                    onClick={() => handleLayerChange(selectedLayer.id, { color: c, finish: 'solid' })}
                    style={{ width: '100%', paddingBottom: '100%', background: c, borderRadius: '2px', cursor: 'pointer', border: selectedLayer.color === c ? '1px solid #fff' : 'none' }} 
                  />
                ))}
              </div>
              
              <div style={{ display: 'flex', gap: '4px' }}>
                {FINISHES.map(f => (
                  <button
                    key={f}
                    onClick={() => handleLayerChange(selectedLayer.id, { finish: f })}
                    style={{ 
                      flex: 1, 
                      fontSize: '10px', 
                      padding: '4px', 
                      background: selectedLayer.finish === f ? 'var(--accent)' : 'rgba(255,255,255,0.1)',
                      color: selectedLayer.finish === f ? '#000' : '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <label style={{ fontSize: '10px', color: 'var(--muted)' }}>Scale</label>
              <span style={{ fontSize: '10px', color: 'var(--accent)' }}>{selectedLayer.scale.toFixed(2)}</span>
            </div>
            <input 
              type="range" min="0.1" max="3" step="0.1" 
              value={selectedLayer.scale} 
              onChange={(e) => handleLayerChange(selectedLayer.id, { scale: parseFloat(e.target.value) })}
              style={{ width: '100%', accentColor: 'var(--accent)' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <label style={{ fontSize: '10px', color: 'var(--muted)' }}>Rotate</label>
              <span style={{ fontSize: '10px', color: 'var(--accent)' }}>{selectedLayer.rotation}°</span>
            </div>
            <input 
              type="range" min="0" max="360" step="5" 
              value={selectedLayer.rotation} 
              onChange={(e) => handleLayerChange(selectedLayer.id, { rotation: parseInt(e.target.value) })}
              style={{ width: '100%', accentColor: 'var(--accent)' }}
            />
          </div>

          {selectedLayer.type !== 'import' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <label style={{ fontSize: '10px', color: 'var(--muted)' }}>Outline Width</label>
                <span style={{ fontSize: '10px', color: 'var(--accent)' }}>{selectedLayer.strokeWidth || 4}px</span>
              </div>
              <input 
                type="range" min="1" max="20" step="1" 
                value={selectedLayer.strokeWidth || 4} 
                onChange={(e) => handleLayerChange(selectedLayer.id, { strokeWidth: parseInt(e.target.value) })}
                style={{ width: '100%', accentColor: 'var(--accent)' }}
              />
            </div>
          )}

          {selectedLayer.id !== 'face' && (
            <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
              <button 
                onClick={() => handleDuplicate(selectedLayer.id)}
                style={{ flex: 1, fontSize: '10px', padding: '6px', background: 'rgba(52, 225, 255, 0.1)', border: '1px solid var(--accent)', color: 'var(--accent)', borderRadius: '4px', cursor: 'pointer' }}
              >
                Duplicate
              </button>
              <button 
                onClick={() => handleDelete(selectedLayer.id)}
                style={{ flex: 1, fontSize: '10px', padding: '6px', background: 'rgba(255,0,0,0.1)', border: '1px solid #ff6b6b', color: '#ff6b6b', borderRadius: '4px', cursor: 'pointer' }}
              >
                Delete
              </button>
            </div>
          )}
        </div>
      )}

      {/* Hint */}
      <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '9px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: '1.4' }}>
        Arrows to move • [ ] scale • {'{ }'} rotate<br/>
        Double-click randomize • Right-click advanced
      </div>
    </div>
  );
}
