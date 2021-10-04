#!/usr/bin/env bash
export EXISTING_VARS=$(printenv | awk -F= '{print $1}' | grep "REACT_APP_*" | sed 's/^/\$/g' | paste -sd,);
echo  "$EXISTING_VARS" | tee -a varss.txt
for file in $JSFOLDER;
do
   cat $file | envsubst $EXISTING_VARS | tee $file
done
nginx -g 'daemon off;'