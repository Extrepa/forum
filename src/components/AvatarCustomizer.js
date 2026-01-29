'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

const INITIAL_PALETTE = [
  '#ffffff',
  '#ff1744',
  '#ff5252',
  '#ff9100',
  '#ffea00',
  '#c6ff00',
  '#00e676',
  '#00e5ff',
  '#00b0ff',
  '#2962ff',
  '#7c4dff',
  '#e040fb',
  '#ff40d6',
  '#ff6d00',
  '#f50057',
  '#18ffff'
];

const GRADIENTS = [
  { id: 'rainbow', name: 'Rainbow', url: 'url(#rainbow-lr)', preview: 'linear-gradient(90deg, #ff0040, #ffa600, #ffee00, #00f11d, #00a2ff, #6f4dff, #ff00b1)' },
  { id: 'fire', name: 'Fire', url: 'url(#fire-lr)', preview: 'linear-gradient(180deg, #ff4d00, #ff9e00, #ff0000)' },
  { id: 'ocean', name: 'Ocean', url: 'url(#ocean-lr)', preview: 'linear-gradient(135deg, #00d4ff, #0055ff, #00ff95)' },
  { id: 'toxic', name: 'Toxic', url: 'url(#toxic-lr)', preview: 'linear-gradient(90deg, #c3ff00, #34d399, #00ff00)' }
];

const GRADIENT_DIRECTIONS = [
  { id: 'lr', label: '→', x1: '0%', y1: '0%', x2: '100%', y2: '0%' },
  { id: 'tb', label: '↓', x1: '0%', y1: '0%', x2: '0%', y2: '100%' },
  { id: 'diag1', label: '↘', x1: '0%', y1: '0%', x2: '100%', y2: '100%' },
  { id: 'diag2', label: '↗', x1: '0%', y1: '100%', x2: '100%', y2: '0%' }
];

const renderGradientStops = (id) => {
  switch (id) {
    case 'rainbow':
      return (
        <>
          <stop offset="0%" stopColor="#ff0040"><animate attributeName="stop-color" values="#ff0040;#ffa600;#ffee00;#00f11d;#00a2ff;#6f4dff;#ff00b1;#ff0040" dur="3s" repeatCount="indefinite" /></stop>
          <stop offset="100%" stopColor="#ff00b1"><animate attributeName="stop-color" values="#ff00b1;#ff0040;#ffa600;#ffee00;#00f11d;#00a2ff;#6f4dff;#ff00b1" dur="3s" repeatCount="indefinite" /></stop>
        </>
      );
    case 'fire':
      return (
        <>
          <stop offset="0%" stopColor="#ff4d00"><animate attributeName="stop-color" values="#ff4d00;#ff9e00;#ff4d00" dur="2s" repeatCount="indefinite" /></stop>
          <stop offset="100%" stopColor="#ff0000"><animate attributeName="stop-color" values="#ff0000;#ff4d00;#ff0000" dur="2s" repeatCount="indefinite" /></stop>
        </>
      );
    case 'ocean':
      return (
        <>
          <stop offset="0%" stopColor="#00d4ff"><animate attributeName="stop-color" values="#00d4ff;#0055ff;#00d4ff" dur="4s" repeatCount="indefinite" /></stop>
          <stop offset="100%" stopColor="#00ff95"><animate attributeName="stop-color" values="#00ff95;#00d4ff;#00ff95" dur="4s" repeatCount="indefinite" /></stop>
        </>
      );
    case 'toxic':
      return (
        <>
          <stop offset="0%" stopColor="#c3ff00"><animate attributeName="stop-color" values="#c3ff00;#34d399;#c3ff00" dur="1.5s" repeatCount="indefinite" /></stop>
          <stop offset="100%" stopColor="#00ff00"><animate attributeName="stop-color" values="#00ff00;#c3ff00;#00ff00" dur="1.5s" repeatCount="indefinite" /></stop>
        </>
      );
    default:
      return null;
  }
};

const INITIAL_LAYERS = [
  {
    id: 'face',
    type: 'face',
    d: 'M541 197 L542 196 L581 196 L582 197 L599 197 L600 198 L609 198 L610 199 L618 199 L619 200 L626 200 L627 201 L633 201 L634 202 L639 202 L640 203 L646 203 L647 204 L652 204 L653 205 L657 205 L658 206 L662 206 L663 207 L667 207 L668 208 L671 208 L672 209 L675 209 L676 210 L679 210 L680 211 L683 211 L684 212 L687 212 L688 213 L690 213 L691 214 L694 214 L695 215 L697 215 L698 216 L700 216 L701 217 L704 217 L705 218 L707 218 L708 219 L710 219 L711 220 L713 220 L714 221 L716 221 L717 222 L719 222 L720 223 L722 223 L723 224 L725 224 L726 225 L728 225 L729 226 L731 226 L732 227 L733 227 L734 228 L736 228 L737 229 L738 229 L739 230 L741 230 L742 231 L744 231 L745 232 L746 232 L747 233 L748 233 L749 234 L751 234 L752 235 L753 235 L754 236 L755 236 L756 237 L757 237 L758 238 L760 238 L761 239 L762 239 L763 240 L764 240 L765 241 L766 241 L767 242 L768 242 L769 243 L770 243 L771 244 L773 244 L774 245 L775 245 L776 246 L777 246 L778 247 L779 247 L780 248 L781 248 L782 249 L783 249 L784 250 L785 250 L786 251 L787 251 L788 252 L789 252 L790 253 L791 253 L793 255 L794 255 L795 256 L796 256 L797 257 L798 257 L799 258 L800 258 L802 260 L803 260 L804 261 L805 261 L806 262 L807 262 L809 264 L810 264 L811 265 L812 265 L814 267 L815 267 L816 268 L817 268 L819 270 L820 270 L821 271 L822 271 L824 273 L825 273 L827 275 L828 275 L830 277 L831 277 L833 279 L834 279 L836 281 L837 281 L840 284 L841 284 L843 286 L844 286 L847 289 L848 289 L850 291 L851 291 L854 294 L855 294 L858 297 L859 297 L863 301 L864 301 L869 306 L870 306 L874 310 L875 310 L880 315 L881 315 L890 324 L891 324 L892 325 L892 326 L893 326 L919 352 L919 353 L929 363 L929 364 L933 368 L933 369 L939 375 L939 376 L943 380 L943 381 L947 385 L947 386 L950 389 L950 390 L952 392 L952 393 L955 396 L955 397 L958 400 L958 401 L960 403 L960 404 L963 407 L963 408 L965 410 L965 411 L967 413 L967 414 L969 416 L969 417 L971 419 L971 420 L972 421 L972 422 L974 424 L974 425 L976 427 L976 428 L977 429 L977 430 L979 432 L979 433 L980 434 L980 435 L982 437 L982 438 L983 439 L983 440 L985 442 L985 443 L986 444 L986 445 L987 446 L987 447 L988 448 L988 449 L990 451 L990 452 L991 453 L991 454 L992 455 L992 456 L993 457 L993 458 L994 459 L994 460 L995 461 L995 462 L996 463 L996 464 L997 465 L997 466 L998 467 L998 468 L999 469 L999 470 L1000 471 L1000 472 L1001 473 L1001 474 L1002 475 L1002 476 L1003 477 L1003 478 L1004 479 L1004 481 L1005 482 L1005 483 L1006 484 L1006 485 L1007 486 L1007 487 L1008 488 L1008 489 L1009 490 L1009 492 L1010 493 L1010 494 L1011 495 L1011 497 L1012 498 L1012 499 L1013 500 L1013 501 L1014 502 L1014 504 L1015 505 L1015 507 L1016 508 L1016 509 L1017 510 L1017 512 L1018 513 L1018 515 L1019 516 L1019 518 L1020 519 L1020 521 L1021 522 L1021 523 L1022 524 L1022 526 L1023 527 L1023 529 L1024 530 L1024 532 L1025 533 L1025 535 L1026 536 L1026 538 L1027 539 L1027 541 L1028 542 L1028 545 L1029 546 L1029 548 L1030 549 L1030 552 L1031 553 L1031 555 L1032 556 L1032 559 L1033 560 L1033 563 L1034 564 L1034 567 L1035 568 L1035 571 L1036 572 L1036 576 L1037 577 L1037 581 L1038 582 L1038 585 L1039 586 L1039 591 L1040 592 L1040 596 L1041 597 L1041 602 L1042 603 L1042 608 L1043 609 L1043 615 L1044 616 L1044 622 L1045 623 L1045 631 L1046 632 L1046 641 L1047 642 L1047 655 L1048 656 L1048 709 L1047 710 L1047 723 L1046 724 L1046 733 L1045 734 L1045 742 L1044 743 L1044 749 L1043 750 L1043 756 L1042 757 L1042 762 L1041 763 L1041 768 L1040 769 L1040 773 L1039 774 L1039 778 L1038 779 L1038 783 L1037 784 L1037 788 L1036 789 L1036 793 L1035 794 L1035 797 L1034 798 L1034 801 L1033 802 L1033 805 L1032 806 L1032 808 L1031 809 L1031 812 L1030 813 L1030 816 L1029 817 L1029 819 L1028 820 L1028 822 L1027 823 L1027 825 L1026 826 L1026 828 L1025 829 L1025 831 L1024 832 L1024 835 L1023 836 L1023 837 L1022 838 L1022 840 L1021 841 L1021 843 L1020 844 L1020 846 L1019 847 L1019 849 L1018 850 L1018 851 L1017 852 L1017 854 L1016 855 L1016 857 L1015 858 L1015 860 L1014 861 L1014 862 L1013 863 L1013 865 L1012 866 L1012 867 L1011 868 L1011 870 L1010 871 L1010 872 L1009 873 L1009 874 L1008 875 L1008 876 L1007 877 L1007 879 L1006 880 L1006 881 L1005 882 L1005 883 L1004 884 L1004 885 L1003 886 L1003 887 L1002 888 L1002 889 L1001 890 L1001 892 L1000 893 L1000 894 L999 895 L999 896 L998 897 L998 898 L997 899 L997 900 L996 901 L996 902 L995 903 L995 904 L994 905 L994 906 L993 907 L993 908 L992 909 L992 910 L991 911 L991 912 L989 914 L989 915 L988 916 L988 917 L987 918 L987 919 L986 920 L986 921 L984 923 L984 924 L983 925 L983 926 L981 928 L981 929 L980 930 L980 931 L979 932 L979 933 L977 935 L977 936 L975 938 L975 939 L974 940 L974 941 L972 943 L972 944 L971 945 L971 946 L969 948 L969 949 L967 951 L967 952 L965 954 L965 955 L963 957 L963 958 L960 961 L960 962 L958 964 L958 965 L955 968 L955 969 L952 972 L952 973 L950 975 L950 976 L946 980 L946 981 L943 984 L943 985 L939 989 L939 990 L934 995 L934 996 L928 1002 L928 1003 L919 1012 L919 1013 L894 1038 L893 1038 L893 1039 L892 1040 L891 1040 L882 1049 L881 1049 L875 1055 L874 1055 L870 1059 L869 1059 L865 1063 L864 1063 L860 1067 L859 1067 L856 1070 L855 1070 L851 1074 L850 1074 L848 1076 L847 1076 L844 1079 L843 1079 L841 1081 L840 1081 L838 1083 L837 1083 L835 1085 L834 1085 L832 1087 L831 1087 L829 1089 L828 1089 L826 1091 L825 1091 L823 1093 L822 1093 L820 1095 L819 1095 L818 1096 L817 1096 L815 1098 L814 1098 L813 1099 L812 1099 L810 1101 L809 1101 L808 1102 L807 1102 L805 1104 L804 1104 L803 1105 L802 1105 L801 1106 L800 1106 L799 1107 L798 1107 L796 1109 L795 1109 L794 1110 L793 1110 L792 1111 L791 1111 L790 1112 L789 1112 L788 1113 L787 1113 L785 1115 L784 1115 L783 1116 L782 1116 L781 1117 L780 1117 L779 1118 L778 1118 L777 1119 L776 1119 L775 1120 L774 1120 L773 1121 L772 1121 L771 1122 L769 1122 L768 1123 L767 1123 L766 1124 L765 1124 L764 1125 L763 1125 L762 1126 L760 1126 L759 1127 L758 1127 L757 1128 L756 1128 L755 1129 L753 1129 L752 1130 L751 1130 L750 1131 L749 1131 L748 1132 L746 1132 L745 1133 L744 1133 L743 1134 L742 1134 L741 1135 L739 1135 L738 1136 L736 1136 L735 1137 L734 1137 L733 1138 L731 1138 L730 1139 L729 1139 L728 1140 L726 1140 L725 1141 L723 1141 L722 1142 L720 1142 L719 1143 L717 1143 L716 1144 L714 1144 L713 1145 L711 1145 L710 1146 L708 1146 L707 1147 L704 1147 L703 1148 L701 1148 L700 1149 L697 1149 L696 1150 L694 1150 L693 1151 L690 1151 L689 1152 L687 1152 L686 1153 L683 1153 L682 1154 L679 1154 L678 1155 L675 1155 L674 1156 L671 1156 L670 1157 L667 1157 L666 1158 L662 1158 L661 1159 L657 1159 L656 1160 L652 1160 L651 1161 L647 1161 L646 1162 L641 1162 L640 1163 L634 1163 L633 1164 L627 1164 L626 1165 L619 1165 L618 1166 L610 1166 L609 1167 L598 1167 L597 1168 L578 1168 L577 1169 L545 1169 L544 1168 L526 1168 L525 1167 L514 1167 L513 1166 L505 1166 L504 1165 L497 1165 L496 1164 L490 1164 L489 1163 L483 1163 L482 1162 L478 1162 L477 1161 L472 1161 L471 1160 L467 1160 L466 1159 L462 1159 L461 1158 L458 1158 L457 1157 L454 1157 L453 1156 L449 1156 L448 1155 L445 1155 L444 1154 L442 1154 L441 1153 L438 1153 L437 1152 L434 1152 L433 1151 L430 1151 L429 1150 L427 1150 L426 1149 L424 1149 L423 1148 L420 1148 L419 1147 L417 1147 L416 1146 L414 1146 L413 1145 L411 1145 L410 1144 L407 1144 L406 1143 L404 1143 L403 1142 L402 1142 L401 1141 L399 1141 L398 1140 L396 1140 L395 1139 L393 1139 L392 1138 L391 1138 L390 1137 L388 1137 L387 1136 L386 1136 L385 1135 L383 1135 L382 1134 L381 1134 L380 1133 L378 1133 L377 1132 L376 1132 L375 1131 L374 1131 L373 1130 L371 1130 L370 1129 L369 1129 L368 1128 L367 1128 L366 1127 L364 1127 L363 1126 L362 1126 L361 1125 L360 1125 L359 1124 L358 1124 L357 1123 L356 1123 L355 1122 L353 1122 L352 1121 L351 1121 L350 1120 L349 1120 L348 1119 L347 1119 L346 1118 L345 1118 L344 1117 L343 1117 L342 1116 L341 1116 L340 1115 L339 1115 L338 1114 L337 1114 L335 1112 L334 1112 L333 1111 L332 1111 L331 1110 L330 1110 L329 1109 L328 1109 L327 1108 L326 1108 L324 1106 L323 1106 L322 1105 L321 1105 L320 1104 L319 1104 L318 1103 L317 1103 L315 1101 L314 1101 L313 1100 L312 1100 L310 1098 L309 1098 L308 1097 L307 1097 L305 1095 L304 1095 L303 1094 L302 1094 L300 1092 L299 1092 L297 1090 L296 1090 L294 1088 L293 1088 L291 1086 L290 1086 L287 1083 L286 1083 L284 1081 L283 1081 L281 1079 L280 1079 L278 1077 L277 1077 L274 1074 L273 1074 L270 1071 L269 1071 L265 1067 L264 1067 L261 1064 L260 1064 L256 1060 L255 1060 L251 1056 L250 1056 L243 1049 L242 1049 L235 1042 L234 1042 L202 1010 L202 1009 L195 1002 L195 1001 L188 994 L188 993 L183 988 L183 987 L180 984 L180 983 L177 980 L177 979 L174 976 L174 975 L171 972 L171 971 L167 967 L167 966 L165 964 L165 963 L163 961 L163 960 L161 958 L161 957 L159 955 L159 954 L157 952 L157 951 L155 949 L155 948 L153 946 L153 945 L151 943 L151 942 L149 940 L149 939 L148 938 L148 937 L146 935 L146 934 L144 932 L144 931 L143 930 L143 929 L142 928 L142 927 L140 925 L140 924 L139 923 L139 922 L138 921 L138 920 L137 919 L137 918 L135 916 L135 915 L134 914 L134 913 L133 912 L133 911 L132 910 L132 909 L131 908 L131 907 L130 906 L130 905 L129 904 L129 903 L128 902 L128 901 L126 899 L126 898 L125 897 L125 896 L124 895 L124 894 L123 893 L123 891 L122 890 L122 889 L121 888 L121 887 L120 886 L120 885 L119 884 L119 883 L118 882 L118 881 L117 880 L117 878 L116 877 L116 876 L115 875 L115 873 L114 872 L114 871 L113 870 L113 869 L112 868 L112 866 L111 865 L111 864 L110 863 L110 861 L109 860 L109 859 L108 858 L108 856 L107 855 L107 853 L106 852 L106 851 L105 850 L105 848 L104 847 L104 845 L103 844 L103 843 L102 842 L102 840 L101 839 L101 837 L100 836 L100 834 L99 833 L99 831 L98 830 L98 828 L97 827 L97 824 L96 823 L96 821 L95 820 L95 817 L94 816 L94 813 L93 812 L93 810 L92 809 L92 806 L91 805 L91 802 L90 801 L90 798 L89 797 L89 794 L88 793 L88 790 L87 789 L87 785 L86 784 L86 781 L85 780 L85 776 L84 775 L84 771 L83 770 L83 765 L82 764 L82 759 L81 758 L81 753 L80 752 L80 746 L79 745 L79 738 L78 737 L78 728 L77 727 L77 716 L76 715 L76 693 L75 692 L75 671 L76 670 L76 650 L77 649 L77 637 L78 636 L78 628 L79 627 L79 620 L80 619 L80 613 L81 612 L81 606 L82 605 L82 600 L83 599 L83 595 L84 594 L84 590 L85 589 L85 585 L86 584 L86 580 L87 579 L87 576 L88 575 L88 572 L89 571 L89 568 L90 567 L90 564 L91 563 L91 560 L92 559 L92 556 L93 555 L93 552 L94 551 L94 549 L95 548 L95 545 L96 544 L96 542 L97 541 L97 538 L98 537 L98 535 L99 534 L99 532 L100 531 L100 529 L101 528 L101 526 L102 525 L102 523 L103 522 L103 520 L104 519 L104 518 L105 517 L105 515 L106 514 L106 512 L107 511 L107 510 L108 509 L108 507 L109 506 L109 505 L110 504 L110 502 L111 501 L111 500 L112 499 L112 497 L113 496 L113 495 L114 494 L114 492 L115 491 L115 490 L116 489 L116 488 L117 487 L117 485 L118 484 L118 483 L119 482 L119 481 L120 480 L120 479 L121 478 L121 476 L123 474 L123 472 L124 471 L124 470 L125 469 L125 468 L126 467 L126 466 L127 465 L127 464 L128 463 L128 462 L129 461 L129 460 L131 458 L131 457 L132 456 L132 455 L133 454 L133 453 L134 452 L134 451 L135 450 L135 449 L136 448 L136 447 L138 445 L138 444 L139 443 L139 442 L140 441 L140 440 L141 439 L141 438 L143 436 L143 435 L144 434 L144 433 L146 431 L146 430 L147 429 L147 428 L149 426 L149 425 L151 423 L151 422 L153 420 L153 419 L155 417 L155 416 L156 415 L156 414 L158 412 L158 411 L160 409 L160 408 L162 406 L162 405 L165 402 L165 401 L167 399 L167 398 L170 395 L170 394 L173 391 L173 390 L176 387 L176 386 L179 383 L179 382 L183 378 L183 377 L188 372 L188 371 L193 366 L193 365 L200 358 L200 357 L235 322 L236 322 L236 321 L237 320 L238 320 L244 314 L245 314 L250 309 L251 309 L256 304 L257 304 L261 300 L262 300 L265 297 L266 297 L270 293 L271 293 L273 291 L274 291 L277 288 L278 288 L280 286 L281 286 L284 283 L285 283 L287 281 L288 281 L290 279 L291 279 L293 277 L294 277 L296 275 L297 275 L299 273 L300 273 L302 271 L303 271 L304 270 L305 270 L307 268 L308 268 L309 267 L310 267 L312 265 L313 265 L314 264 L315 264 L317 262 L318 262 L319 261 L320 261 L322 259 L323 259 L324 258 L325 258 L326 257 L327 257 L329 255 L330 255 L331 254 L332 254 L333 253 L334 253 L335 252 L336 252 L337 251 L338 251 L339 250 L340 250 L341 249 L342 249 L343 248 L344 248 L345 247 L346 247 L347 246 L348 246 L349 245 L350 245 L351 244 L352 244 L353 243 L354 243 L355 242 L357 242 L358 241 L359 241 L360 240 L361 240 L362 239 L363 239 L364 238 L365 238 L366 237 L367 237 L368 236 L370 236 L371 235 L372 235 L373 234 L374 234 L375 233 L377 233 L378 232 L379 232 L380 231 L382 231 L383 230 L384 230 L385 229 L387 229 L388 228 L389 228 L390 227 L392 227 L393 226 L395 226 L396 225 L398 225 L399 224 L401 224 L402 223 L404 223 L405 222 L407 222 L408 221 L410 221 L411 220 L413 220 L414 219 L416 219 L417 218 L419 218 L420 217 L422 217 L423 216 L426 216 L427 215 L429 215 L430 214 L432 214 L433 213 L436 213 L437 212 L440 212 L441 211 L444 211 L445 210 L448 210 L449 209 L452 209 L453 208 L456 208 L457 207 L461 207 L462 206 L466 206 L467 205 L471 205 L472 204 L476 204 L477 203 L483 203 L484 202 L489 202 L490 201 L496 201 L497 200 L504 200 L505 199 L513 199 L514 198 L525 198 L526 197 Z',
    color: '#ffffff',
    finish: 'solid',
    stroke: '#e5eef7',
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
    stroke: '#e5eef7',
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
    stroke: '#e5eef7',
    strokeWidth: 4,
    x: 0,
    y: 0,
    scale: 1,
    rotation: 0
  },
  {
    id: 'mouth',
    type: 'mouth',
    d: 'M467 932 L466 933 L454 933 L453 934 L445 934 L444 935 L438 935 L437 936 L432 936 L431 937 L427 937 L426 938 L422 938 L421 939 L418 939 L417 940 L414 940 L413 941 L411 941 L410 942 L408 942 L407 943 L404 943 L403 944 L402 944 L401 945 L399 945 L398 946 L396 946 L395 947 L394 947 L393 948 L391 948 L390 949 L389 949 L388 950 L387 950 L386 951 L385 951 L384 952 L383 952 L382 953 L381 953 L379 955 L378 955 L376 957 L375 957 L373 959 L372 959 L361 970 L361 971 L359 973 L359 974 L358 975 L358 976 L357 977 L357 979 L356 980 L356 982 L355 983 L355 997 L356 998 L356 1001 L357 1002 L357 1003 L358 1004 L358 1006 L359 1007 L359 1008 L360 1009 L360 1010 L362 1012 L362 1013 L363 1014 L363 1015 L368 1020 L368 1021 L372 1025 L373 1025 L377 1029 L378 1029 L380 1031 L381 1031 L383 1033 L384 1033 L386 1035 L387 1035 L388 1036 L389 1036 L391 1038 L392 1038 L393 1039 L394 1039 L395 1040 L397 1040 L398 1041 L399 1041 L400 1042 L401 1042 L402 1043 L404 1043 L405 1044 L406 1044 L407 1045 L409 1045 L410 1046 L412 1046 L413 1047 L415 1047 L416 1048 L418 1048 L419 1049 L422 1049 L423 1050 L426 1050 L427 1051 L431 1051 L432 1052 L437 1052 L438 1053 L444 1053 L445 1054 L455 1054 L456 1055 L486 1055 L487 1054 L497 1054 L498 1053 L505 1053 L506 1052 L511 1052 L512 1051 L517 1051 L518 1050 L522 1050 L523 1049 L527 1049 L528 1048 L531 1048 L532 1047 L536 1047 L537 1046 L539 1046 L540 1045 L543 1045 L544 1044 L547 1044 L548 1043 L550 1043 L551 1042 L554 1042 L555 1041 L557 1041 L558 1040 L560 1040 L561 1039 L563 1039 L564 1038 L566 1038 L567 1037 L568 1037 L569 1036 L571 1036 L572 1035 L574 1035 L575 1034 L577 1034 L578 1033 L579 1033 L580 1032 L582 1032 L583 1031 L584 1031 L585 1030 L586 1030 L587 1029 L589 1029 L590 1028 L591 1028 L592 1027 L593 1027 L594 1026 L595 1026 L596 1025 L597 1025 L598 1024 L599 1024 L600 1023 L601 1023 L602 1022 L603 1022 L605 1020 L606 1020 L607 1019 L608 1019 L610 1017 L611 1017 L612 1016 L613 1016 L615 1014 L616 1014 L619 1011 L620 1011 L623 1008 L624 1008 L633 999 L633 998 L636 995 L636 994 L637 993 L637 992 L638 991 L638 990 L639 989 L639 986 L640 985 L640 980 L639 979 L639 976 L638 975 L638 974 L636 972 L636 971 L630 965 L629 965 L626 962 L625 962 L623 960 L622 960 L620 958 L619 958 L618 957 L617 957 L616 956 L615 956 L614 955 L613 955 L612 954 L611 954 L610 953 L608 953 L607 952 L606 952 L605 951 L603 951 L602 950 L600 950 L599 949 L597 949 L596 948 L594 948 L593 947 L591 947 L590 946 L587 946 L586 945 L584 945 L583 944 L580 944 L579 943 L576 943 L575 942 L572 942 L571 941 L567 941 L566 940 L562 940 L561 939 L557 939 L556 938 L551 938 L550 937 L545 937 L544 936 L537 936 L536 935 L528 935 L527 934 L517 934 L516 933 L501 933 L500 932 Z',
    color: '#0a0a0a',
    finish: 'solid',
    stroke: '#e5eef7',
    strokeWidth: 4,
    x: 0,
    y: 0,
    scale: 1,
    rotation: 0
  }
];

const PALETTE = INITIAL_PALETTE; // Kept for logic compatibility
const FINISHES = ['solid', 'glow', 'glitter', 'gradient'];

function getPathBounds(d) {
  const pts = d.match(/[ML]\d+\s\d+/g) || [];
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  pts.forEach(p => {
    const [x, y] = p.slice(1).split(' ').map(Number);
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  });
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

export default function AvatarCustomizer({ onSave, onCancel, initialState }) {
  const [layers, setLayers] = useState(initialState?.layers || INITIAL_LAYERS);
  const [history, setHistory] = useState([initialState?.layers || INITIAL_LAYERS]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [selectedLayerId, setSelectedLayerId] = useState(null);
  const [isMounted, setIsMounted] = useState(false);
  const [clipboard, setClipboard] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);
  const [panelPos, setPanelPos] = useState({ top: 8, left: 8 });
  const [isDraggingPanel, setIsDraggingPanel] = useState(false);
  const panelDragStart = useRef({ x: 0, y: 0, initialTop: 8, initialLeft: 8 });
  const [palette, setPalette] = useState(() => [...INITIAL_PALETTE]);
  const [activeControlTab, setActiveControlTab] = useState('fill'); // 'fill' or 'outline'
  const colorInputRef = useRef(null);
  const [pickingForIndex, setPickingForIndex] = useState(null);
  const pickingForIndexRef = useRef(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);
  const [hoverUndo, setHoverUndo] = useState(false);
  const [hoverRedo, setHoverRedo] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const lastTapRef = useRef(0);
  const longPressRef = useRef(null);
  const dragStart = useRef({ x: 0, y: 0 });
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const panelRef = useRef(null);
  const imageFillInputRef = useRef(null);
  const lastContextMenuRef = useRef(0);

  const PANEL_WIDTH = 195;

  // Refs for keyboard handler to avoid stale closures
  const layersRef = useRef(layers);
  useEffect(() => { layersRef.current = layers; }, [layers]);
  const selectedLayerIdRef = useRef(selectedLayerId);
  useEffect(() => { selectedLayerIdRef.current = selectedLayerId; }, [selectedLayerId]);

  const pushHistory = useCallback((newLayers) => {
    const nextHistory = history.slice(0, historyIndex + 1);
    nextHistory.push(newLayers);
    // Keep last 50 steps
    if (nextHistory.length > 99999) nextHistory.shift();
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

  const randomizeLayer = useCallback((id) => {
    const nextLayers = layers.map(l => {
      if (l.id !== id || l.type === 'import') return l;
      const allowGlow = l.type !== 'mouth';
      const finish = allowGlow && Math.random() < 0.4 ? rand(FINISHES) : 'solid';
      const color = rand(palette);
      const stroke = rand(palette);
      const strokeWidth = Math.floor(Math.random() * 6) + 2;
      const gradientPick = finish === 'gradient' ? rand(GRADIENTS) : null;
      const gradientUrl = gradientPick ? gradientPick.url : undefined;
      const gradientId = gradientPick ? gradientPick.id : undefined;
      return { ...l, color, finish, stroke, strokeWidth, gradientUrl, gradientId, gradientDirection: gradientPick ? 'lr' : undefined, strokeFinish: 'solid', strokeGradientUrl: undefined, strokeGradientId: undefined, strokeGradientDirection: undefined };
    });
    setLayers(nextLayers);
    pushHistory(nextLayers);
  }, [layers, palette, pushHistory]);

  const handleRandomizeAll = () => {
    const nextLayers = layers.map(l => {
      if (l.type === 'import') return l;
      const allowGlow = l.type !== 'mouth';
      const finish = allowGlow && Math.random() < 0.4 ? rand(FINISHES) : 'solid';
      const color = rand(palette);
      const stroke = rand(palette);
      const strokeWidth = Math.floor(Math.random() * 6) + 2;
      const gradientPick = finish === 'gradient' ? rand(GRADIENTS) : null;
      const gradientUrl = gradientPick ? gradientPick.url : undefined;
      const gradientId = gradientPick ? gradientPick.id : undefined;
      return { ...l, color, finish, stroke, strokeWidth, gradientUrl, gradientId, gradientDirection: gradientPick ? 'lr' : undefined, strokeFinish: 'solid', strokeGradientUrl: undefined, strokeGradientId: undefined, strokeGradientDirection: undefined };
    });
    setLayers(nextLayers);
    pushHistory(nextLayers);
  };

  const handleReset = () => {
    if (!window.confirm("Restore factory defaults? All custom modifications will be purged from the buffer.")) return;
    setPalette([...INITIAL_PALETTE]);
    const nextLayers = INITIAL_LAYERS.map((l) => {
      const fillColor = l.color || '#000000';
      const outlineColor = l.stroke || '#ffffff';
      return { 
        ...l, 
        color: fillColor, 
        finish: l.finish || 'solid', 
        stroke: outlineColor, 
        strokeWidth: l.strokeWidth || 4, 
        gradientUrl: l.gradientUrl,
        gradientId: l.gradientId,
        strokeFinish: l.strokeFinish || 'solid', 
        strokeGradientUrl: l.strokeGradientUrl 
      };
    });
    setLayers(nextLayers);
    pushHistory(nextLayers);
  };

  const openColorPicker = (index) => {
    setPickingForIndex(index);
    pickingForIndexRef.current = index;
    if (colorInputRef.current) {
      // Set the current color to the input so the picker starts at the right spot
      if (typeof index === 'number' && palette[index]) {
        colorInputRef.current.value = palette[index];
      }
      colorInputRef.current.click();
    }
  };

  const handleColorChange = (e) => {
    const newColor = e.target.value;
    const targetIndex = pickingForIndexRef.current ?? pickingForIndex;
    
    if (targetIndex === 'wheel') {
      if (selectedLayer) {
        handleLayerChange(selectedLayer.id, activeControlTab === 'fill'
          ? { color: newColor, finish: 'solid', gradientId: undefined, gradientDirection: undefined, gradientUrl: undefined, imageUrl: undefined }
          : { stroke: newColor, strokeFinish: 'solid', strokeGradientUrl: undefined, strokeGradientId: undefined, strokeGradientDirection: undefined });
      }
    } else if (targetIndex !== null && targetIndex !== undefined) {
      setPalette(prev => {
        const next = [...prev];
        next[targetIndex] = newColor;
        return next;
      });
    }
    setPickingForIndex(null);
    pickingForIndexRef.current = null;
  };

  const handleSave = useCallback(() => {
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgRef.current);
    onSave(svgString, { layers });
  }, [layers, onSave]);

  const cx = 561.5;
  const cy = 682.5;

  const handleLayerChange = useCallback((id, updates, skipHistory = false) => {
    setLayers(prev => {
      const next = prev.map(l => l.id === id ? { ...l, ...updates } : l);
      if (!skipHistory) pushHistory(next);
      return next;
    });
  }, [pushHistory]);

  const handleDuplicate = useCallback((id) => {
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
  }, [layers, pushHistory]);

  const handleCopy = useCallback(() => {
    const layer = layers.find(l => l.id === selectedLayerId);
    if (!layer || layer.type === 'face') return;
    setClipboard({ ...layer });
  }, [layers, selectedLayerId]);

  const handlePaste = useCallback(() => {
    if (!clipboard) return;
    const newLayer = {
      ...clipboard,
      id: `${clipboard.type}-${Date.now()}`,
      x: clipboard.x + 20,
      y: clipboard.y + 20
    };
    const nextLayers = [...layers, newLayer];
    setLayers(nextLayers);
    setSelectedLayerId(newLayer.id);
    pushHistory(nextLayers);
  }, [layers, clipboard, pushHistory]);

  const handleDelete = useCallback((id) => {
    if (id === 'face') return;
    const nextLayers = layers.filter(l => l.id !== id);
    setLayers(nextLayers);
    if (selectedLayerId === id) setSelectedLayerId(null);
    setContextMenu(null);
    pushHistory(nextLayers);
  }, [layers, selectedLayerId, pushHistory]);

  const handleMouseDown = (e, id) => {
    if (e.button !== 0) return; // Only allow left click for dragging
    setSelectedLayerId(id);
    setContextMenu(null);
    if (id === 'face') return;
    setIsDragging(true);
    const point = getSVGPoint(e);
    const layer = layers.find(l => l.id === id);
    if (layer) {
      dragStart.current = { x: point.x - layer.x, y: point.y - layer.y };
    }
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

  const positionPanelAtPoint = (clientX, clientY) => {
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1000;
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 1000;
    const panelHeight = panelRef.current?.offsetHeight || 400; 

    setPanelPos({
      left: Math.min(Math.max(clientX - PANEL_WIDTH / 2, 8), viewportWidth - PANEL_WIDTH - 8),
      top: Math.min(Math.max(clientY - 24, 8), viewportHeight - panelHeight - 8)
    });
  };

  const handleContextMenu = (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    
    setSelectedLayerId(id);
    setContextMenu({ x: e.clientX, y: e.clientY, id });
    
    // Use requestAnimationFrame to ensure panelRef is available if just opened
    requestAnimationFrame(() => positionPanelAtPoint(e.clientX, e.clientY));
  };

  const clampPanelToViewport = useCallback(() => {
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1000;
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 1000;
    
    setPanelPos((prev) => {
      const panelHeight = panelRef.current?.offsetHeight || 0;
      const nextLeft = Math.min(Math.max(prev.left, 8), viewportWidth - PANEL_WIDTH - 8);
      const nextTop = Math.min(Math.max(prev.top, 8), viewportHeight - panelHeight - 8);
      
      if (prev.left === nextLeft && prev.top === nextTop) return prev;
      return { left: nextLeft, top: nextTop };
    });
  }, []);

  useEffect(() => {
    if (!contextMenu) return;
    clampPanelToViewport();
    const handleResize = () => clampPanelToViewport();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [clampPanelToViewport, contextMenu]);

  const getGradientId = (layer) => {
    if (layer.gradientId) return layer.gradientId;
    if (layer.gradientUrl) {
      const found = GRADIENTS.find((g) => layer.gradientUrl.includes(g.id));
      return found?.id;
    }
    return null;
  };

  const getStrokeGradientId = (layer) => {
    if (layer.strokeGradientId) return layer.strokeGradientId;
    if (layer.strokeGradientUrl) {
      const found = GRADIENTS.find((g) => layer.strokeGradientUrl.includes(g.id));
      return found?.id;
    }
    return null;
  };

  const getSVGPoint = (e) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  };

  const getSVGPointFromTouch = (touch) => {
    const svg = svgRef.current;
    if (!svg || !touch) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = touch.clientX;
    pt.y = touch.clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Global shortcuts
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
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setContextMenu(null);
        return;
      }

      // Selected layer shortcuts
      const selId = selectedLayerIdRef.current;
      if (!selId || selId === 'face') return;
      if (contextMenu) return; // Only allow movement/transform when settings panel is closed or specifically focused

      const currentLayers = layersRef.current;
      const layer = currentLayers.find(l => l.id === selId);
      if (!layer) return;

      const step = e.shiftKey ? 10 : 2;
      const scaleStep = 0.05;
      const rotateStep = 5;

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          handleLayerChange(selId, { y: layer.y - step });
          break;
        case 'ArrowDown':
          e.preventDefault();
          handleLayerChange(selId, { y: layer.y + step });
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handleLayerChange(selId, { x: layer.x - step });
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleLayerChange(selId, { x: layer.x + step });
          break;
        case '[':
        case '-':
          e.preventDefault();
          handleLayerChange(selId, { scale: Math.max(0.1, layer.scale - scaleStep) });
          break;
        case ']':
        case '=':
        case '+':
          e.preventDefault();
          handleLayerChange(selId, { scale: layer.scale + scaleStep });
          break;
        case '{':
          e.preventDefault();
          handleLayerChange(selId, { rotation: (layer.rotation - rotateStep + 360) % 360 });
          break;
        case '}':
          e.preventDefault();
          handleLayerChange(selId, { rotation: (layer.rotation + rotateStep) % 360 });
          break;
        case 'r':
        case 'R':
          if (!e.metaKey && !e.ctrlKey) {
            e.preventDefault();
            randomizeLayer(selId);
          }
          break;
        case 'Backspace':
        case 'Delete':
          e.preventDefault();
          handleDelete(selId);
          break;
        case 'c':
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            handleCopy();
          }
          break;
        case 'v':
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            handlePaste();
          }
          break;
        case 'd':
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            handleDuplicate(selId);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, handleSave, handleLayerChange, handleCopy, handlePaste, handleDuplicate, handleDelete, randomizeLayer, contextMenu]);

  const handlePanelMouseDown = (e) => {
    if (e.button !== 0) return; // Only left-click should drag the panel
    if (e.target.closest('button')) return; // Don't drag if clicking close button
    setIsDraggingPanel(true);
    panelDragStart.current = { 
      x: e.clientX, 
      y: e.clientY, 
      initialTop: panelPos.top, 
      initialLeft: panelPos.left 
    };
  };

  const handlePanelTouchStart = (e) => {
    const touch = e.touches?.[0];
    if (!touch) return;
    if (e.target.closest('button')) return;
    e.preventDefault();
    setIsDraggingPanel(true);
    panelDragStart.current = { 
      x: touch.clientX, 
      y: touch.clientY, 
      initialTop: panelPos.top, 
      initialLeft: panelPos.left 
    };
  };

  useEffect(() => {
    const handleMove = (clientX, clientY) => {
      if (!isDraggingPanel) return;
      const dx = clientX - panelDragStart.current.x;
      const dy = clientY - panelDragStart.current.y;
      
      const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1000;
      const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 1000;
      const panelHeight = panelRef.current?.offsetHeight || 0;
      
      const nextTop = panelDragStart.current.initialTop + dy;
      const nextLeft = panelDragStart.current.initialLeft + dx;
      
      setPanelPos({
        top: Math.min(Math.max(nextTop, 8), viewportHeight - panelHeight - 8),
        left: Math.min(Math.max(nextLeft, 8), viewportWidth - PANEL_WIDTH - 8)
      });
    };

    const onMouseMove = (e) => handleMove(e.clientX, e.clientY);
    const onTouchMove = (e) => {
      if (e.touches?.[0]) {
        if (e.cancelable) e.preventDefault();
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };
    const onEnd = () => setIsDraggingPanel(false);

    if (isDraggingPanel) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onEnd);
      window.addEventListener('touchmove', onTouchMove, { passive: false });
      window.addEventListener('touchend', onEnd);
    }
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onEnd);
    };
  }, [isDraggingPanel]);

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

  const handleImageFillImport = (e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedLayerId) return;
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file.');
      e.target.value = '';
      return;
    }
    const maxSize = 512 * 1024;
    if (file.size > maxSize) {
      alert('Image too large. Please use an image under 512KB.');
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      handleLayerChange(selectedLayerId, { finish: 'image', imageUrl: reader.result });
      e.target.value = '';
    };
    reader.readAsDataURL(file);
  };

  const selectedLayer = layers.find(l => l.id === selectedLayerId);
  const handleSvgMouseMove = (e) => {
    handleMouseMove(e);
    setShowHint(e.target === e.currentTarget);
  };
  const handleTouchStartLayer = (e, id) => {
    const touch = e.touches?.[0];
    if (!touch) return;
    if (contextMenu) return;
    
    // Reset long press
    if (longPressRef.current) {
      clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }
    
    // Store touch start for movement threshold
    dragStart.current = { x: touch.clientX, y: touch.clientY, isLongPress: true };
    
    if (selectedLayerId === id && id !== 'face') {
      setIsDragging(true);
      const point = getSVGPointFromTouch(touch);
      const layer = layers.find(l => l.id === id);
      if (layer) {
        dragStart.current = { ...dragStart.current, x: point.x - layer.x, y: point.y - layer.y, isLongPress: false };
      }
      return;
    }
    
    setSelectedLayerId(id);
    longPressRef.current = setTimeout(() => {
      if (dragStart.current.isLongPress) {
        setSelectedLayerId(id);
        setContextMenu({ x: touch.clientX, y: touch.clientY, id });
        requestAnimationFrame(() => positionPanelAtPoint(touch.clientX, touch.clientY));
      }
    }, 500);
  };

  const handleTouchEndLayer = (e, id) => {
    if (longPressRef.current) {
      clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }
    if (isDragging) {
      setIsDragging(false);
      pushHistory(layers);
      return;
    }
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      randomizeLayer(id);
      lastTapRef.current = 0;
      return;
    }
    lastTapRef.current = now;
  };

  const handleTouchMove = (e) => {
    const touch = e.touches?.[0];
    if (!touch) return;

    // If moving significantly, cancel long press
    if (longPressRef.current && dragStart.current.isLongPress) {
      const dx = Math.abs(touch.clientX - dragStart.current.x);
      const dy = Math.abs(touch.clientY - dragStart.current.y);
      if (dx > 10 || dy > 10) {
        clearTimeout(longPressRef.current);
        longPressRef.current = null;
        dragStart.current.isLongPress = false;
      }
    }

    if (!isDragging || !selectedLayerId) return;
    e.preventDefault();
    const point = getSVGPointFromTouch(touch);
    handleLayerChange(selectedLayerId, {
      x: point.x - dragStart.current.x,
      y: point.y - dragStart.current.y
    }, true);
  };

  const wheelColor = selectedLayer
    ? (activeControlTab === 'fill' ? (selectedLayer.color || '#ffffff') : (selectedLayer.stroke || '#ffffff'))
    : '#ffffff';

  const applyWheelColor = (newColor) => {
    if (!selectedLayer) return;
    if (activeControlTab === 'fill') {
      handleLayerChange(selectedLayer.id, { color: newColor, finish: 'solid', gradientId: undefined, gradientDirection: undefined, gradientUrl: undefined, imageUrl: undefined });
      return;
    }
    handleLayerChange(selectedLayer.id, { stroke: newColor, strokeFinish: 'solid', strokeGradientUrl: undefined, strokeGradientId: undefined, strokeGradientDirection: undefined });
  };

  return (
    <div 
      ref={containerRef}
      className="avatar-customizer-container card" 
      style={{ 
        position: 'relative',
        width: '100%',
        height: 'auto',
        display: 'flex',
        flexDirection: 'column',
        padding: '8px',
        alignSelf: 'flex-start',
        borderRadius: '12px',
        boxSizing: 'border-box'
      }}
    >
      <div 
        className="canvas-card" 
        style={{ 
          background: 'rgba(2, 7, 10, 0.4)', 
          borderRadius: '12px', 
          border: 'none',
          overflow: 'hidden',
          position: 'relative',
          aspectRatio: '1 / 1',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)'
        }}
        ref={canvasRef}
        onMouseMove={() => setShowHint(false)}
        onMouseLeave={() => setShowHint(false)}
      >
        {/* Undo/Redo Floating UI */}
        <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', gap: '6px', zIndex: 10 }}>
          <button 
            onClick={(e) => { e.stopPropagation(); undo(); }} 
            onMouseEnter={() => setHoverUndo(true)}
            onMouseLeave={() => setHoverUndo(false)}
            disabled={historyIndex === 0}
            style={{ 
              width: '28px', height: '28px', borderRadius: '50%', 
              border: '1px solid rgba(52, 225, 255, 0.2)', 
              background: 'rgba(2, 7, 10, 0.6)', cursor: historyIndex === 0 ? 'default' : 'pointer',
              opacity: historyIndex === 0 ? 0.3 : 1, fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: hoverUndo && historyIndex > 0 ? '0 0 12px rgba(52, 225, 255, 0.65)' : '0 0 8px rgba(0,0,0,0.3)',
              borderColor: hoverUndo && historyIndex > 0 ? 'var(--accent)' : 'rgba(52, 225, 255, 0.2)',
              color: hoverUndo && historyIndex > 0 ? 'var(--accent)' : 'var(--ink)',
              transition: 'all 0.2s ease',
              padding: 0, minHeight: 0
            }}
            title="Rewind (Ctrl+Z)"
          >
            ⟲
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); redo(); }} 
            onMouseEnter={() => setHoverRedo(true)}
            onMouseLeave={() => setHoverRedo(false)}
            disabled={historyIndex === history.length - 1}
            style={{ 
              width: '28px', height: '28px', borderRadius: '50%', 
              border: '1px solid rgba(52, 225, 255, 0.2)', 
              background: 'rgba(2, 7, 10, 0.6)', cursor: historyIndex === history.length - 1 ? 'default' : 'pointer',
              opacity: historyIndex === history.length - 1 ? 0.3 : 1, fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: hoverRedo && historyIndex < history.length - 1 ? '0 0 12px rgba(52, 225, 255, 0.65)' : '0 0 8px rgba(0,0,0,0.3)',
              borderColor: hoverRedo && historyIndex < history.length - 1 ? 'var(--accent)' : 'rgba(52, 225, 255, 0.2)',
              color: hoverRedo && historyIndex < history.length - 1 ? 'var(--accent)' : 'var(--ink)',
              transition: 'all 0.2s ease',
              padding: 0, minHeight: 0
            }}
            title="Fast-Forward (Ctrl+Y)"
          >
            ⟳
          </button>
        </div>
        <button
          type="button"
          onClick={() => setIsHelpOpen((prev) => !prev)}
          title="System Manual"
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.15)',
            background: 'rgba(2, 7, 10, 0.2)',
            color: 'rgba(255,255,255,0.35)',
            cursor: 'pointer',
            fontSize: '11px',
            lineHeight: '16px',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            zIndex: 10,
            minWidth: '16px',
            maxWidth: '16px',
            minHeight: '16px',
            maxHeight: '16px',
            boxSizing: 'border-box',
            flex: '0 0 auto',
            boxShadow: 'none'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--accent)';
            e.currentTarget.style.borderColor = 'var(--accent)';
            e.currentTarget.style.boxShadow = '0 0 10px rgba(52, 225, 255, 0.6)';
            e.currentTarget.style.background = 'rgba(2, 7, 10, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'rgba(255,255,255,0.35)';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.background = 'rgba(2, 7, 10, 0.2)';
          }}
        >
          ?
        </button>
        {isHelpOpen && (
          <div
            style={{
              position: 'absolute',
              top: '36px',
              right: '10px',
              width: '240px',
              background: 'rgba(2, 7, 10, 0.95)',
              border: '1px solid rgba(52, 225, 255, 0.3)',
              borderRadius: '10px',
              padding: '10px',
              color: 'var(--ink)',
              zIndex: 11,
              boxShadow: '0 8px 20px rgba(0, 0, 0, 0.45)',
              fontSize: '11px',
              lineHeight: '1.4'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <strong style={{ fontSize: '11px', color: 'var(--accent)' }}>Avatar Customizer</strong>
              <button
                type="button"
                onClick={() => setIsHelpOpen(false)}
                title="Close Manual"
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--muted)',
                  cursor: 'pointer',
                  fontSize: '12px',
                  padding: 0,
                  lineHeight: 1
                }}
              >
                ✕
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ borderBottom: '1px solid rgba(52, 225, 255, 0.1)', paddingBottom: '4px' }}>
                <strong style={{ color: 'var(--accent)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Desktop</strong>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span>• <strong>Move:</strong> Drag or Arrows (Shift for 5x)</span>
                <span>• <strong>Scale/Rotate:</strong> + / - and {'{ / }'} keys</span>
                <span>• <strong>Customize:</strong> Right‑click a piece</span>
                <span>• <strong>Randomize:</strong> &apos;R&apos; key or Double‑click</span>
                <span>• <strong>Undo/Redo:</strong> Ctrl+Z / Ctrl+Y</span>
              </div>
              
              <div style={{ borderBottom: '1px solid rgba(52, 225, 255, 0.1)', paddingBottom: '4px', marginTop: '4px' }}>
                <strong style={{ color: 'var(--accent)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Mobile / Touch</strong>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span>• <strong>Move:</strong> Touch and Drag</span>
                <span>• <strong>Customize:</strong> Long‑press a piece</span>
                <span>• <strong>Randomize:</strong> Double‑tap piece</span>
                <span>• <strong>History:</strong> Floating icons (top‑left)</span>
                <span>• <strong>Settings:</strong> Drag panel header to move</span>
              </div>
            </div>
          </div>
        )}

        <svg
          ref={svgRef}
          viewBox="70 191 983 983"
          onMouseMove={handleSvgMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleMouseUp}
          style={{ width: '100%', height: '100%', flex: 1, minHeight: 0, touchAction: 'none', cursor: 'pointer', overflow: 'visible', paddingTop: '8px', paddingBottom: '8px', boxSizing: 'border-box' }}
          onClick={(e) => {
            setContextMenu(null);
            if (e.target === e.currentTarget) {
              setShowHint((prev) => !prev);
            }
          }}
        >
          <defs>
            {layers.filter((layer) => layer.finish === 'glow').map((layer) => (
              <filter key={`glow-${layer.id}`} id={`glow-fx-${layer.id}`} x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation={layer.glowIntensity ?? 28} result="blur" />
                <feComposite in="blur" in2="SourceAlpha" operator="out" result="glow" />
                <feMerge>
                  <feMergeNode in="glow" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            ))}
            <filter id="glitter-fx">
              <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="2" seed="2" result="noise">
                <animate attributeName="baseFrequency" dur="3s" values="0.6;0.9;0.6" repeatCount="indefinite" />
                <animate attributeName="seed" dur="2.4s" values="1;5;1" repeatCount="indefinite" />
              </feTurbulence>
              <feColorMatrix in="noise" type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.7 0" result="sparkle" />
              <feComposite in="sparkle" in2="SourceAlpha" operator="in" />
              <feBlend in="SourceGraphic" mode="screen" />
            </filter>
            {GRADIENTS.map((gradient) => (
              GRADIENT_DIRECTIONS.map((dir) => (
                <linearGradient key={`${gradient.id}-${dir.id}`} id={`${gradient.id}-${dir.id}`} x1={dir.x1} y1={dir.y1} x2={dir.x2} y2={dir.y2}>
                  {renderGradientStops(gradient.id)}
                </linearGradient>
              ))
            ))}
            {layers.filter((layer) => layer.finish === 'image' && layer.imageUrl).map((layer) => (
              <pattern
                key={`img-fill-${layer.id}`}
                id={`img-fill-${layer.id}`}
                patternUnits="objectBoundingBox"
                patternContentUnits="objectBoundingBox"
                width="1"
                height="1"
              >
                <image href={layer.imageUrl} x="0" y="0" width="1" height="1" preserveAspectRatio="xMidYMid slice" />
              </pattern>
            ))}
          </defs>
          
          {layers.map((layer) => {
            const bounds = layer.type === 'import' ? { x: 250, y: 250, width: 500, height: 500 } : getPathBounds(layer.d);
            const gradientId = getGradientId(layer);
            const gradientDirection = layer.gradientDirection || 'lr';
            const gradientUrl = gradientId ? `url(#${gradientId}-${gradientDirection})` : layer.gradientUrl;
            return (
              <g
                key={layer.id}
                transform={`translate(${layer.x}, ${layer.y}) translate(${cx}, ${cy}) scale(${layer.scale * (layer.flipX || 1)}, ${layer.scale * (layer.flipY || 1)}) rotate(${layer.rotation}) translate(${-cx}, ${-cy})`}
                onMouseDown={(e) => handleMouseDown(e, layer.id)}
                onContextMenu={(e) => handleContextMenu(e, layer.id)}
                onDoubleClick={() => randomizeLayer(layer.id)}
                onTouchStart={(e) => handleTouchStartLayer(e, layer.id)}
                onTouchEnd={(e) => handleTouchEndLayer(e, layer.id)}
                style={{ cursor: layer.id === 'face' ? 'default' : 'move' }}
              >
                {layer.type === 'import' ? (
                  <image href={layer.url} x="250" y="250" width="500" height="500" />
                ) : (
                  <path
                    d={layer.d}
                    fill={layer.finish === 'image' && layer.imageUrl ? `url(#img-fill-${layer.id})` : (layer.finish === 'gradient' ? gradientUrl : layer.color)}
                    filter={layer.finish === 'glow' ? `url(#glow-fx-${layer.id})` : layer.finish === 'glitter' ? 'url(#glitter-fx)' : ''}
                    stroke={layer.strokeFinish === 'gradient' ? (layer.strokeGradientUrl || gradientUrl || layer.stroke || 'var(--line)') : (layer.stroke || 'var(--line)')}
                    strokeWidth={layer.strokeWidth || 4}
                    style={{ transition: 'fill 0.3s ease' }}
                  />
                )}
                {selectedLayerId === layer.id && layer.id !== 'face' && (
                  <rect 
                    x={bounds.x - 5} 
                    y={bounds.y - 5} 
                    width={bounds.width + 10} 
                    height={bounds.height + 10} 
                    fill="none" 
                    stroke="var(--accent)" 
                    strokeWidth="4" 
                    strokeDasharray="20,20" 
                  />
                )}
              </g>
            );
          })}
        </svg>

        {/* Action Bar */}
        <div
          style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '6px', borderTop: '1px solid rgba(52, 225, 255, 0.2)', background: 'rgba(0,0,0,0.4)', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}
          onMouseEnter={() => setShowHint(false)}
          onTouchStart={() => setShowHint(false)}
        >
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'nowrap', minWidth: 0 }}>
            <button 
              onClick={handleRandomizeAll}
              title="Chaos Protocol: Randomize everything"
              style={{ 
                flex: '1 1 0', minWidth: 0, minHeight: '24px', borderRadius: '999px', border: '1px solid var(--accent)', 
                background: 'rgba(52, 225, 255, 0.1)', color: 'var(--accent)', cursor: 'pointer', 
                fontSize: '9px', fontWeight: '600', letterSpacing: '0.3px',
                transition: 'all 0.2s ease', fontFamily: '"Space Grotesk", sans-serif',
                boxShadow: '0 0 10px rgba(52, 225, 255, 0.15)'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(52, 225, 255, 0.2)'; e.currentTarget.style.boxShadow = '0 0 20px rgba(52, 225, 255, 0.3)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(52, 225, 255, 0.1)'; e.currentTarget.style.boxShadow = '0 0 10px rgba(52, 225, 255, 0.15)'; }}
            >
              🎲 RANDOM
            </button>
            <button 
              onClick={handleReset}
              title="Factory Restore: Default shapes, fresh colors"
              style={{ 
                flex: '1 1 0', minWidth: 0, minHeight: '24px', borderRadius: '999px', border: '1px solid rgba(255,107,107,0.35)', 
                background: 'rgba(255, 80, 80, 0.08)', color: '#ff9a9a', cursor: 'pointer', 
                fontSize: '9px', fontWeight: '600', transition: 'all 0.2s ease', fontFamily: '"Space Grotesk", sans-serif'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 80, 80, 0.18)'; e.currentTarget.style.borderColor = 'rgba(255,107,107,0.6)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 80, 80, 0.08)'; e.currentTarget.style.borderColor = 'rgba(255,107,107,0.35)'; }}
            >
              ⟲ RESET
            </button>
            <button
              type="button"
              title="Tech Upgrade (Coming Soon)"
              disabled
              style={{ 
                flex: '1 1 0', minWidth: 0, minHeight: '24px', padding: '0 8px', background: 'rgba(255,255,255,0.03)', 
                border: '1px solid rgba(255,255,255,0.12)', borderRadius: '999px', display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: '0px', cursor: 'not-allowed', 
                fontSize: '9px', color: 'rgba(255,255,255,0.45)', fontWeight: '600', transition: 'all 0.2s ease',
                fontFamily: '"Space Grotesk", sans-serif', boxShadow: 'none', lineHeight: 1.1
              }}
            >
              ✨ ACCESSORIES
              <span style={{ fontSize: '8px', color: 'rgba(255,255,255,0.35)', fontWeight: '500' }}>Coming Soon</span>
            </button>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button 
              onClick={() => {
                const serializer = new XMLSerializer();
                const svgClone = svgRef.current.cloneNode(true);
                svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
                svgClone.setAttribute('width', '1024');
                svgClone.setAttribute('height', '1024');
                svgClone.setAttribute('preserveAspectRatio', 'xMidYMid meet');
                svgClone.removeAttribute('style');
                const computeFaceViewBox = () => {
                  const faceLayer = layers.find((layer) => layer.id === 'face');
                  if (!faceLayer) return null;
                  const bounds = getPathBounds(faceLayer.d);
                  if (!Number.isFinite(bounds.x) || !Number.isFinite(bounds.y)) return null;
                  const strokePad = (faceLayer.strokeWidth || 4) * 2;
                  const size = Math.max(bounds.width, bounds.height) + strokePad;
                  const cxB = bounds.x + bounds.width / 2;
                  const cyB = bounds.y + bounds.height / 2;
                  const pad = 0;
                  return `${(cxB - size / 2 - pad).toFixed(2)} ${(cyB - size / 2 - pad).toFixed(2)} ${(size + pad * 2).toFixed(2)} ${(size + pad * 2).toFixed(2)}`;
                };

                const computeSceneViewBox = () => {
                  let minX = Infinity;
                  let minY = Infinity;
                  let maxX = -Infinity;
                  let maxY = -Infinity;
                  const applyTransform = (x, y, layer) => {
                    const sx = (layer.scale || 1) * (layer.flipX || 1);
                    const sy = (layer.scale || 1) * (layer.flipY || 1);
                    const rad = ((layer.rotation || 0) * Math.PI) / 180;
                    let tx = x - cx;
                    let ty = y - cy;
                    tx *= sx;
                    ty *= sy;
                    const rx = tx * Math.cos(rad) - ty * Math.sin(rad);
                    const ry = tx * Math.sin(rad) + ty * Math.cos(rad);
                    return {
                      x: rx + cx + (layer.x || 0),
                      y: ry + cy + (layer.y || 0)
                    };
                  };
                  layers.forEach((layer) => {
                    const bounds = layer.type === 'import'
                      ? { x: 250, y: 250, width: 500, height: 500 }
                      : getPathBounds(layer.d);
                    const corners = [
                      { x: bounds.x, y: bounds.y },
                      { x: bounds.x + bounds.width, y: bounds.y },
                      { x: bounds.x, y: bounds.y + bounds.height },
                      { x: bounds.x + bounds.width, y: bounds.y + bounds.height }
                    ];
                    corners.forEach((pt) => {
                      const t = applyTransform(pt.x, pt.y, layer);
                      minX = Math.min(minX, t.x);
                      minY = Math.min(minY, t.y);
                      maxX = Math.max(maxX, t.x);
                      maxY = Math.max(maxY, t.y);
                    });
                  });
                  if (!Number.isFinite(minX) || !Number.isFinite(minY)) {
                    return '70 191 983 983';
                  }
                  const cxB = (minX + maxX) / 2;
                  const cyB = (minY + maxY) / 2;
                  const size = Math.max(maxX - minX, maxY - minY) + 40;
                  return `${(cxB - size / 2).toFixed(2)} ${(cyB - size / 2).toFixed(2)} ${size.toFixed(2)} ${size.toFixed(2)}`;
                };
                const computeDomBBox = () => {
                  try {
                    const temp = document.createElement('div');
                    temp.style.position = 'absolute';
                    temp.style.left = '-9999px';
                    temp.style.top = '-9999px';
                    temp.style.width = '0';
                    temp.style.height = '0';
                    temp.style.overflow = 'hidden';
                    document.body.appendChild(temp);
                    temp.appendChild(svgClone);
                    const bbox = svgClone.getBBox();
                    document.body.removeChild(temp);
                    if (!bbox || bbox.width === 0 || bbox.height === 0) {
                      return null;
                    }
                    const size = Math.max(bbox.width, bbox.height);
                    const cxB = bbox.x + bbox.width / 2;
                    const cyB = bbox.y + bbox.height / 2;
                    const pad = 0;
                    return `${(cxB - size / 2 - pad).toFixed(2)} ${(cyB - size / 2 - pad).toFixed(2)} ${(size + pad * 2).toFixed(2)} ${(size + pad * 2).toFixed(2)}`;
                  } catch (e) {
                    return null;
                  }
                };
                svgClone.setAttribute('viewBox', computeFaceViewBox() || computeDomBBox() || computeSceneViewBox());
                const svgString = serializer.serializeToString(svgClone);
                onSave(svgString, { layers });
              }}
              title="Upload Profile: Sync changes to the network"
              style={{ 
                flex: 2,
                minHeight: '28px',
                borderRadius: '999px',
                border: 'none',
                background: 'linear-gradient(135deg, rgba(52, 225, 255, 0.9), rgba(255, 52, 245, 0.9))',
                color: '#001018',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '600',
                transition: 'all 0.2s ease',
                fontFamily: '"Space Grotesk", sans-serif',
                padding: '6px 12px',
                whiteSpace: 'nowrap',
                boxShadow: '0 0 12px rgba(52, 225, 255, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px) scale(1.02)';
                e.currentTarget.style.boxShadow = '0 0 18px rgba(255, 52, 245, 0.45)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = '0 0 12px rgba(52, 225, 255, 0.3)';
              }}
            >
              SAVE CHANGES
            </button>
            <button 
              onClick={() => {
                if (historyIndex > 0) {
                  if (window.confirm("Unsaved modifications detected. Exit anyway?")) {
                    onCancel();
                  }
                } else {
                  onCancel();
                }
              }}
              title="Abort: Exit without saving"
              style={{ 
                flex: 1,
                minHeight: '28px',
                borderRadius: '999px',
                border: '1px solid rgba(52, 225, 255, 0.3)',
                background: 'rgba(2, 7, 10, 0.4)',
                color: 'var(--muted)',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '600',
                transition: 'all 0.2s ease',
                fontFamily: '"Space Grotesk", sans-serif',
                padding: '6px 12px',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(52, 225, 255, 0.08)';
                e.currentTarget.style.borderColor = 'rgba(52, 225, 255, 0.6)';
                e.currentTarget.style.color = 'var(--accent)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(2, 7, 10, 0.4)';
                e.currentTarget.style.borderColor = 'rgba(52, 225, 255, 0.3)';
                e.currentTarget.style.color = 'var(--muted)';
              }}
            >
              CLOSE
            </button>
          </div>
        </div>
      </div>

      {/* Hint */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '52%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          fontSize: '8px',
          color: 'var(--muted)',
          textTransform: 'uppercase',
          fontFamily: '"Space Grotesk", sans-serif',
          letterSpacing: '0.1em',
          lineHeight: '1.2',
          opacity: showHint ? 1 : 0,
          transition: 'opacity 0.2s ease',
          pointerEvents: 'none',
          padding: '4px 8px',
          background: 'rgba(2, 7, 10, 0.45)',
          borderRadius: '8px',
          border: '1px solid rgba(52, 225, 255, 0.15)',
          backdropFilter: 'blur(4px)',
          width: '260px',
          maxWidth: '80%',
          zIndex: 10
        }}
      >
        Desktop: Drag or Arrows • +/- Scale • {'{ }'} Rotate • R-click Customize<br/>
        Mobile: Drag • Long‑press Customize • Double‑tap Randomize
      </div>

      {/* Advanced Side Panel (Condensed Context Menu) */}
      {isMounted && contextMenu && selectedLayer && createPortal(
        <div 
          className="card avatar-customizer-panel"
          ref={panelRef}
          style={{
            position: 'fixed',
            top: `${panelPos.top}px`,
            left: `${panelPos.left}px`,
            zIndex: 10000, // Very high z-index to stay on top
            width: `${PANEL_WIDTH}px`,
            minWidth: `${PANEL_WIDTH}px`,
            maxWidth: `${PANEL_WIDTH}px`,
            boxSizing: 'border-box',
            background: 'var(--errl-panel)',
            backdropFilter: 'blur(16px)',
            borderRadius: '12px',
            border: '1px solid var(--accent)',
            padding: '8px',
            boxShadow: 'var(--shadow)',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            cursor: 'default',
            overflow: 'visible'
          }}
        >
          <div 
            onMouseDown={handlePanelMouseDown}
            onTouchStart={handlePanelTouchStart}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              marginBottom: '2px',
              paddingBottom: '4px',
              borderBottom: '1px solid rgba(52, 225, 255, 0.1)',
              position: 'relative',
              cursor: isDraggingPanel ? 'grabbing' : 'grab',
              gap: '6px',
              touchAction: 'none'
            }}
          >
            <span style={{ fontSize: '12px', color: 'rgba(52, 225, 255, 0.6)', letterSpacing: '1px', lineHeight: 1, marginTop: '-1px' }}>
              ⋯
            </span>
            <span style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--accent)', textTransform: 'uppercase', fontFamily: '"Unbounded", sans-serif', letterSpacing: '0.5px' }}>
              {selectedLayer.type} Settings
            </span>
            <button 
              onClick={() => setContextMenu(null)} 
              title="Dismiss Interface"
              style={{ 
                marginLeft: 'auto',
                width: '22px',
                height: '12px',
                borderRadius: '3px',
                background: 'rgba(2, 7, 10, 0.4)',
                border: '1px solid rgba(52, 225, 255, 0.2)',
                color: 'var(--muted)',
                cursor: 'pointer',
                fontSize: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                lineHeight: 1,
                boxShadow: 'none',
                transition: 'all 0.2s ease',
                minHeight: 0
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(255, 50, 50, 0.2)';
                e.target.style.borderColor = 'rgba(255, 50, 50, 0.4)';
                e.target.style.color = '#ff8888';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(2, 7, 10, 0.4)';
                e.target.style.borderColor = 'rgba(52, 225, 255, 0.2)';
                e.target.style.color = 'var(--muted)';
              }}
            >
              ✕
            </button>
          </div>

          {selectedLayer.type !== 'import' && (
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '999px', padding: '2px', border: '1px solid rgba(52, 225, 255, 0.1)' }}>
              <button 
                onClick={() => setActiveControlTab('fill')}
                title="Surface Texture & Hue"
                style={{ 
                  flex: 1, fontSize: '10px', padding: '6px', border: 'none', borderRadius: '999px', 
                  background: activeControlTab === 'fill' ? 'var(--accent)' : 'transparent', 
                  color: activeControlTab === 'fill' ? '#001018' : 'var(--ink)', 
                  cursor: 'pointer', minHeight: 0, fontWeight: '600', transition: 'all 0.2s ease',
                  boxShadow: activeControlTab === 'fill' ? '0 0 10px rgba(52, 225, 255, 0.3)' : 'none'
                }}
              >FILL</button>
              <button 
                onClick={() => setActiveControlTab('outline')}
                title="Frame & Border"
                style={{ 
                  flex: 1, fontSize: '10px', padding: '6px', border: 'none', borderRadius: '999px', 
                  background: activeControlTab === 'outline' ? 'var(--accent)' : 'transparent', 
                  color: activeControlTab === 'outline' ? '#001018' : 'var(--ink)', 
                  cursor: 'pointer', minHeight: 0, fontWeight: '600', transition: 'all 0.2s ease',
                  boxShadow: activeControlTab === 'outline' ? '0 0 10px rgba(52, 225, 255, 0.3)' : 'none'
                }}
              >OUTLINE</button>
            </div>
          )}

          {activeControlTab === 'fill' ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gridAutoRows: '24px', gap: '3px', position: 'relative' }}>
                {palette.slice(0, 12).map((c, idx) => (
                  <div 
                    key={`${idx}-${c}`} 
                    onClick={() => handleLayerChange(selectedLayer.id, { color: c, finish: 'solid', imageUrl: undefined })}
                    title={`Apply Color ${c}`}
                    style={{ 
                      width: '100%',
                      height: '100%',
                      background: c, 
                      borderRadius: '3px', 
                      cursor: 'pointer', 
                      border: selectedLayer.color === c ? '2px solid var(--accent)' : '1px solid rgba(255,255,255,0.1)'
                    }} 
                  />
                ))}
                <div 
                  title="Spectrum Core"
                  style={{ 
                    position: 'absolute', bottom: '3px', right: '3px', width: '18px', height: '18px', 
                    background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)', 
                    borderRadius: '50%', cursor: 'pointer', border: '1px solid #fff', zIndex: 2
                  }}
                >
                  <input
                    type="color"
                    value={wheelColor}
                    onInput={(e) => applyWheelColor(e.target.value)}
                    title="Extract Custom Hue"
                    style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                  />
                </div>
              </div>

              {selectedLayer.type !== 'import' && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
                    {['solid', 'glow', 'glitter'].map(f => (
                      <button
                        key={f}
                        onClick={() => handleLayerChange(selectedLayer.id, { finish: f, imageUrl: undefined })}
                        title={`Apply ${f.toUpperCase()} Surface`}
                        style={{ 
                          fontSize: '9px', padding: '8px 2px', 
                          background: selectedLayer.finish === f ? 'var(--accent)' : 'rgba(255,255,255,0.05)', 
                          color: selectedLayer.finish === f ? '#001018' : 'var(--ink)', 
                          border: '1px solid ' + (selectedLayer.finish === f ? 'var(--accent)' : 'rgba(52, 225, 255, 0.2)'), 
                          borderRadius: '8px', cursor: 'pointer', minHeight: 0,
                          fontFamily: '"Space Grotesk", sans-serif', fontWeight: '600', transition: 'all 0.2s ease'
                        }}
                      >
                        {f.toUpperCase()}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => imageFillInputRef.current?.click()}
                      title="Inject Custom Texture"
                      style={{
                        fontSize: '14px',
                        padding: '6px 0',
                        background: selectedLayer.finish === 'image' ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
                        color: selectedLayer.finish === 'image' ? '#001018' : 'var(--ink)',
                        border: '1px solid ' + (selectedLayer.finish === 'image' ? 'var(--accent)' : 'rgba(52, 225, 255, 0.2)'),
                        borderRadius: '8px',
                        cursor: 'pointer',
                        minHeight: 0,
                        fontFamily: '"Space Grotesk", sans-serif',
                        fontWeight: '600',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      🖼️
                    </button>
                  </div>
                  <input
                    ref={imageFillInputRef}
                    type="file"
                    accept="image/*,.gif"
                    onChange={handleImageFillImport}
                    style={{ display: 'none' }}
                  />
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
                    {GRADIENTS.map(g => (
                      <button
                        key={g.id}
                        onClick={() => {
                          const nextDirection = selectedLayer.gradientDirection || 'lr';
                          handleLayerChange(selectedLayer.id, { finish: 'gradient', gradientId: g.id, gradientDirection: nextDirection, gradientUrl: `url(#${g.id}-${nextDirection})` });
                        }}
                        title={`Stream ${g.name.toUpperCase()} Pulse`}
                        style={{ 
                          fontSize: '12px', 
                          padding: '12px 0', 
                          background: g.preview, 
                          border: '1px solid ' + (selectedLayer.finish === 'gradient' && getGradientId(selectedLayer) === g.id ? 'var(--accent)' : 'rgba(52, 225, 255, 0.2)'), 
                          borderRadius: '8px', 
                          cursor: 'pointer', 
                          minHeight: 0,
                          fontFamily: '"Space Grotesk", sans-serif',
                          fontWeight: '600',
                          transition: 'all 0.2s ease',
                          boxShadow: selectedLayer.finish === 'gradient' && getGradientId(selectedLayer) === g.id ? '0 0 10px rgba(52, 225, 255, 0.35)' : 'none'
                        }}
                      />
                    ))}
                  </div>
                </>
              )}

                        {selectedLayer.finish === 'glow' && (
                          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: '2px', alignItems: 'center', marginTop: '0px', minHeight: '12px' }}>
                            <label style={{ fontSize: '9px', color: 'var(--muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: 1, padding: 0, margin: 0 }}>GLOW</label>
                            <span style={{ fontSize: '9px', color: 'var(--accent)', fontWeight: 'bold', textAlign: 'center', lineHeight: 1 }}>{selectedLayer.glowIntensity ?? 28}</span>
                            <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                              <button
                                type="button"
                                onClick={() => handleLayerChange(selectedLayer.id, { glowIntensity: Math.max(8, (selectedLayer.glowIntensity ?? 28) - 2) })}
                                style={{ width: '24px', height: '24px', minWidth: '24px', maxWidth: '24px', minHeight: '24px', maxHeight: '24px', borderRadius: '6px', border: '1px solid rgba(52, 225, 255, 0.3)', background: 'rgba(2, 7, 10, 0.6)', color: 'var(--accent)', cursor: 'pointer', padding: 0, lineHeight: '24px', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box', flex: '0 0 auto', overflow: 'hidden' }}
                                title="Dim Emission"
                              >
                                −
                              </button>
                              <button
                                type="button"
                                onClick={() => handleLayerChange(selectedLayer.id, { glowIntensity: Math.min(48, (selectedLayer.glowIntensity ?? 28) + 2) })}
                                style={{ width: '24px', height: '24px', minWidth: '24px', maxWidth: '24px', minHeight: '24px', maxHeight: '24px', borderRadius: '6px', border: '1px solid rgba(52, 225, 255, 0.3)', background: 'rgba(2, 7, 10, 0.6)', color: 'var(--accent)', cursor: 'pointer', padding: 0, lineHeight: '24px', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box', flex: '0 0 auto', overflow: 'hidden' }}
                                title="Boost Emission"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        )}

                        {selectedLayer.finish === 'gradient' && (
                          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: '2px', alignItems: 'center', marginTop: '0px', minHeight: '12px' }}>
                            <label style={{ fontSize: '9px', color: 'var(--muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: 1, padding: 0, margin: 0 }}>DIR</label>
                            <span style={{ fontSize: '9px', color: 'var(--muted)', fontWeight: '600', textAlign: 'center', lineHeight: 1 }}>ANGLE</span>
                            <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                              {GRADIENT_DIRECTIONS.map((dir) => {
                                const activeGradientId = getGradientId(selectedLayer) || GRADIENTS[0]?.id || 'rainbow';
                                const activeDirection = selectedLayer.gradientDirection || 'lr';
                                return (
                                  <button
                                    key={dir.id}
                                    type="button"
                                    onClick={() => handleLayerChange(selectedLayer.id, { gradientDirection: dir.id, gradientUrl: `url(#${activeGradientId}-${dir.id})` })}
                                    style={{ width: '24px', height: '24px', minWidth: '24px', maxWidth: '24px', minHeight: '24px', maxHeight: '24px', borderRadius: '6px', border: '1px solid rgba(52, 225, 255, 0.3)', background: activeDirection === dir.id ? 'rgba(52, 225, 255, 0.2)' : 'rgba(2, 7, 10, 0.6)', color: 'var(--accent)', cursor: 'pointer', padding: 0, lineHeight: '24px', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box', flex: '0 0 auto', overflow: 'hidden' }}
                                    title={`Pulse Direction: ${dir.label}`}
                                  >
                                    {dir.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: '2px', alignItems: 'center', marginTop: '0px', minHeight: '12px' }}>
                          <label style={{ fontSize: '9px', color: 'var(--muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: 1, padding: 0, margin: 0 }}>SCALE</label>
                          <span style={{ fontSize: '9px', color: 'var(--accent)', fontWeight: 'bold', textAlign: 'center', lineHeight: 1 }}>{selectedLayer.scale.toFixed(2)}</span>
                          <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                            <button
                              type="button"
                              onClick={() => handleLayerChange(selectedLayer.id, { scale: Math.max(0.1, selectedLayer.scale - 0.05) })}
                              style={{ width: '24px', height: '24px', minWidth: '24px', maxWidth: '24px', minHeight: '24px', maxHeight: '24px', borderRadius: '6px', border: '1px solid rgba(52, 225, 255, 0.3)', background: 'rgba(2, 7, 10, 0.6)', color: 'var(--accent)', cursor: 'pointer', padding: 0, lineHeight: '24px', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box', flex: '0 0 auto', overflow: 'hidden' }}
                              title="Compress"
                            >
                              −
                            </button>
                            <button
                              type="button"
                              onClick={() => handleLayerChange(selectedLayer.id, { scale: selectedLayer.scale + 0.05 })}
                              style={{ width: '24px', height: '24px', minWidth: '24px', maxWidth: '24px', minHeight: '24px', maxHeight: '24px', borderRadius: '6px', border: '1px solid rgba(52, 225, 255, 0.3)', background: 'rgba(2, 7, 10, 0.6)', color: 'var(--accent)', cursor: 'pointer', padding: 0, lineHeight: '24px', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box', flex: '0 0 auto', overflow: 'hidden' }}
                              title="Expand"
                            >
                              +
                            </button>
                          </div>
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: '2px', alignItems: 'center', marginTop: '0px', minHeight: '12px' }}>
                          <label style={{ fontSize: '9px', color: 'var(--muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: 1, padding: 0, margin: 0 }}>ROTATE</label>
                          <span style={{ fontSize: '9px', color: 'var(--accent)', fontWeight: 'bold', textAlign: 'center', lineHeight: 1 }}>{selectedLayer.rotation}°</span>
                          <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                            <button
                              type="button"
                              onClick={() => handleLayerChange(selectedLayer.id, { rotation: (selectedLayer.rotation - 5 + 360) % 360 })}
                              style={{ width: '24px', height: '24px', minWidth: '24px', maxWidth: '24px', minHeight: '24px', maxHeight: '24px', borderRadius: '6px', border: '1px solid rgba(52, 225, 255, 0.3)', background: 'rgba(2, 7, 10, 0.6)', color: 'var(--accent)', cursor: 'pointer', padding: 0, lineHeight: '24px', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box', flex: '0 0 auto', overflow: 'hidden' }}
                              title="Shift Left"
                            >
                              ←
                            </button>
                            <button
                              type="button"
                              onClick={() => handleLayerChange(selectedLayer.id, { rotation: (selectedLayer.rotation + 5) % 360 })}
                              style={{ width: '24px', height: '24px', minWidth: '24px', maxWidth: '24px', minHeight: '24px', maxHeight: '24px', borderRadius: '6px', border: '1px solid rgba(52, 225, 255, 0.3)', background: 'rgba(2, 7, 10, 0.6)', color: 'var(--accent)', cursor: 'pointer', padding: 0, lineHeight: '24px', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box', flex: '0 0 auto', overflow: 'hidden' }}
                              title="Shift Right"
                            >
                              →
                            </button>
                          </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: '2px', alignItems: 'center', marginTop: '0px', minHeight: '12px' }}>
                          <label style={{ fontSize: '9px', color: 'var(--muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: 1, padding: 0, margin: 0 }}>MIRROR</label>
                          <span style={{ fontSize: '9px', color: 'var(--muted)', fontWeight: '600', textAlign: 'center', lineHeight: 1 }}>FLIP</span>
                          <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                            <button
                              type="button"
                              onClick={() => handleLayerChange(selectedLayer.id, { flipX: (selectedLayer.flipX || 1) * -1 })}
                              style={{ width: '24px', height: '24px', minWidth: '24px', maxWidth: '24px', minHeight: '24px', maxHeight: '24px', borderRadius: '6px', border: '1px solid rgba(52, 225, 255, 0.3)', background: selectedLayer.flipX === -1 ? 'rgba(52, 225, 255, 0.2)' : 'rgba(2, 7, 10, 0.6)', color: 'var(--accent)', cursor: 'pointer', padding: 0, lineHeight: '24px', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box', flex: '0 0 auto', overflow: 'hidden' }}
                              title="Mirror X"
                            >
                              ⇋
                            </button>
                            <button
                              type="button"
                              onClick={() => handleLayerChange(selectedLayer.id, { flipY: (selectedLayer.flipY || 1) * -1 })}
                              style={{ width: '24px', height: '24px', minWidth: '24px', maxWidth: '24px', minHeight: '24px', maxHeight: '24px', borderRadius: '6px', border: '1px solid rgba(52, 225, 255, 0.3)', background: selectedLayer.flipY === -1 ? 'rgba(52, 225, 255, 0.2)' : 'rgba(2, 7, 10, 0.6)', color: 'var(--accent)', cursor: 'pointer', padding: 0, lineHeight: '24px', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box', flex: '0 0 auto', overflow: 'hidden' }}
                              title="Mirror Y"
                            >
                              ⇵
                            </button>
                          </div>
                        </div>
                {selectedLayer.id !== 'face' && (
                  <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                    <button 
                      onClick={() => handleDuplicate(selectedLayer.id)} 
                      title="Clone (Ctrl+D)" 
                      style={{ 
                        flex: 1, fontSize: '10px', padding: '8px 4px', 
                        background: 'rgba(52, 225, 255, 0.1)', border: '1px solid rgba(52, 225, 255, 0.3)', 
                        color: 'var(--accent)', borderRadius: '8px', cursor: 'pointer', minHeight: 0,
                        fontWeight: '600', fontFamily: '"Space Grotesk", sans-serif', transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(52, 225, 255, 0.2)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(52, 225, 255, 0.1)'}
                    >DUP</button>
                    <button 
                      onClick={() => randomizeLayer(selectedLayer.id)} 
                      title="Mutate (R)" 
                      style={{ 
                        flex: 1, fontSize: '10px', padding: '8px 4px', 
                        background: 'rgba(52, 225, 255, 0.1)', border: '1px solid rgba(52, 225, 255, 0.3)', 
                        color: 'var(--accent)', borderRadius: '8px', cursor: 'pointer', minHeight: 0,
                        fontWeight: '600', fontFamily: '"Space Grotesk", sans-serif', transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(52, 225, 255, 0.2)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(52, 225, 255, 0.1)'}
                    >RAND</button>
                    <button 
                      onClick={() => handleDelete(selectedLayer.id)} 
                      title="Purge (Del)" 
                      style={{ 
                        flex: 1, fontSize: '10px', padding: '8px 4px', 
                        background: 'rgba(255,0,0,0.1)', border: '1px solid rgba(255,107,107,0.3)', 
                        color: '#ff6b6b', borderRadius: '8px', cursor: 'pointer', minHeight: 0,
                        fontWeight: '600', fontFamily: '"Space Grotesk", sans-serif', transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,0,0,0.15)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,0,0,0.1)'}
                    >DEL</button>
                  </div>
                )}
            </>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gridAutoRows: '24px', gap: '3px', position: 'relative' }}>
                {palette.slice(0, 12).map((c, idx) => (
                  <div 
                    key={`${idx}-${c}-outline`} 
                    onClick={() => handleLayerChange(selectedLayer.id, { stroke: c, strokeFinish: 'solid', strokeGradientUrl: undefined })}
                    title={`Frame Color ${c}`}
                    style={{ 
                      width: '100%', 
                      height: '100%',
                      background: c, 
                      borderRadius: '3px', 
                      cursor: 'pointer', 
                      border: selectedLayer.stroke === c ? '2px solid var(--accent)' : '1px solid rgba(255,255,255,0.1)'
                    }} 
                  />
                ))}
                <div 
                  title="Frame Spectrum"
                  style={{ 
                    position: 'absolute', bottom: '3px', right: '3px', width: '18px', height: '18px', 
                    background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)', 
                    borderRadius: '50%', cursor: 'pointer', border: '1px solid #fff', zIndex: 2
                  }}
                >
                  <input
                    type="color"
                    value={wheelColor}
                    onChange={(e) => applyWheelColor(e.target.value)}
                    title="Extract Border Hue"
                    style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '9px', color: 'var(--muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>OUTLINE FINISH</label>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4px' }}>
                  {['solid', 'gradient'].map(f => (
                    <button
                      key={`outline-${f}`}
                      onClick={() => {
                        if (f === 'gradient') {
                          const nextId = getStrokeGradientId(selectedLayer) || GRADIENTS[0]?.id || 'rainbow';
                          const nextDir = selectedLayer.strokeGradientDirection || 'lr';
                          handleLayerChange(selectedLayer.id, { strokeFinish: f, strokeGradientId: nextId, strokeGradientDirection: nextDir, strokeGradientUrl: `url(#${nextId}-${nextDir})` });
                          return;
                        }
                        handleLayerChange(selectedLayer.id, { strokeFinish: f, strokeGradientUrl: undefined, strokeGradientId: undefined, strokeGradientDirection: undefined });
                      }}
                      title={`Apply ${f.toUpperCase()} to Frame`}
                      style={{ 
                        fontSize: '10px', 
                        padding: '4px 0', 
                        background: (selectedLayer.strokeFinish || 'solid') === f ? 'var(--accent)' : 'rgba(255,255,255,0.05)', 
                        color: (selectedLayer.strokeFinish || 'solid') === f ? '#001018' : 'var(--ink)', 
                        border: '1px solid ' + ((selectedLayer.strokeFinish || 'solid') === f ? 'var(--accent)' : 'rgba(52, 225, 255, 0.2)'), 
                        borderRadius: '999px', cursor: 'pointer', minHeight: 0,
                        fontFamily: '"Space Grotesk", sans-serif', fontWeight: '600', transition: 'all 0.2s ease'
                      }}
                    >
                      {f.toUpperCase()}
                    </button>
                  ))}
                </div>
                {(selectedLayer.strokeFinish || 'solid') === 'gradient' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
                    {GRADIENTS.map(g => (
                      <button
                        key={`outline-${g.id}`}
                        onClick={() => handleLayerChange(selectedLayer.id, { strokeFinish: 'gradient', strokeGradientId: g.id, strokeGradientDirection: selectedLayer.strokeGradientDirection || 'lr', strokeGradientUrl: `url(#${g.id}-${selectedLayer.strokeGradientDirection || 'lr'})` })}
                        title={`Stream ${g.name.toUpperCase()} to Frame`}
                        style={{ 
                          fontSize: '12px', 
                          padding: '10px 0', 
                          background: g.preview, 
                          border: '1px solid ' + ((selectedLayer.strokeFinish || 'solid') === 'gradient' && getStrokeGradientId(selectedLayer) === g.id ? 'var(--accent)' : 'rgba(52, 225, 255, 0.2)'), 
                          borderRadius: '8px', 
                          cursor: 'pointer', 
                          minHeight: 0,
                          fontFamily: '"Space Grotesk", sans-serif',
                          fontWeight: '600',
                          transition: 'all 0.2s ease',
                          boxShadow: (selectedLayer.strokeFinish || 'solid') === 'gradient' && getStrokeGradientId(selectedLayer) === g.id ? '0 0 10px rgba(52, 225, 255, 0.35)' : 'none'
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '9px', color: 'var(--muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>THICKNESS</label>
                  <span style={{ fontSize: '9px', color: 'var(--accent)', fontWeight: 'bold' }}>{selectedLayer.strokeWidth || 4}px</span>
                </div>
                <input type="range" min="1" max="15" step="1" value={selectedLayer.strokeWidth || 4} onChange={(e) => handleLayerChange(selectedLayer.id, { strokeWidth: parseInt(e.target.value) })} title="Adjust Frame Thickness" style={{ width: '100%', accentColor: 'var(--accent)', height: '8px', cursor: 'pointer', margin: 0 }} />
              </div>
            </>
          )}

        </div>,
        document.body
      )}
    
    {/* Hidden Color Input (kept in DOM for reliable programmatic open) */}
    <input 
      type="color" 
      ref={colorInputRef} 
      onInput={handleColorChange} 
      style={{ position: 'absolute', opacity: 0, width: '1px', height: '1px', pointerEvents: 'none' }} 
      aria-hidden="true"
      tabIndex={-1}
    />
  </div>
);
}
