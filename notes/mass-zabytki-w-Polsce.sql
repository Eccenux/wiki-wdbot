/*
	Masowe usuwanie zabytek w Polsce.
	
	Usuwanie powinno być niezaleźne od kolejności.
	
	# ✅lista Q.
	# PoC usuwania wartości z danego prop, dla których funkcja-warunek(wartość, claim) == true.
	# Masowe usuwanie.
*/
SELECT item
, lat, lon
, inspireids
, monumentstatus
, itemlabel
--, typelabels, townlabel, statelabel, monumentstatus, otherthen, street
FROM public.wlz_dupl
where monumentstatus ~ ','
and monumentstatus in
(
	'zabytek nieruchomy, zabytek w Polsce',
	'zabytek w Polsce, zabytek nieruchomy'
)
;

/*
SELECT count(*), count(distinct item), monumentstatus
FROM public.wlz_dupl
where monumentstatus ~ ','
and monumentstatus != 'zabytek nieruchomy, zabytek w Polsce'
group by monumentstatus
order by 1 asc
*/