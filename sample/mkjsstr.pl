print("var str=[");
while($LINE = <STDIN>) {
    chomp($LINE);
    $LINE =~ s/^\s+//g;
    print("'$LINE',\n");
}
print("''].join('');\n");
