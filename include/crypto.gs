_crypto_get_dependency = function(self)
	if not self.crypto then
		self.crypto = include_lib("/lib/crypto.so")
		if not self.crypto then 
			self.crypto = include_lib(get_shell.host_computer.current_path + "/crypto.so")
		end if
		if not self.crypto then exit("Error: Can't load crypto.so")
		return self.crypto
	else
		return self.crypto
	end if
end function

_crypto_decipher = function(self, encdata)
	save_to_dictionary = function(decrypted_password)
		filePath = home_dir + "/"
		fileName = "dictionary.dict"
		if not get_shell.host_computer.File(filePath + fileName) then
			get_shell.host_computer.touch(home_dir, fileName)
		else
			passwd_dictionary = get_shell.host_computer.File(filePath + fileName)
			has_entry_already = passwd_dictionary.content.split(char(10)).indexOf(decrypted_password) != null
			if passwd_dictionary.content.len == 0 then
				print("First password to go into the file!")
				passwd_dictionary.set_content(decrypted_password)
			else if not has_entry_already then
				updated_dictionary = [passwd_dictionary.content]
				updated_dictionary.push(decrypted_password)
				passwd_dictionary.set_content(updated_dictionary.join(char(10)))
			end if
		end if
	end function
	
	cryptolib = self.dependencies.get_dependency()
	if encdata.len != 2 then
		exit("decipher: wrong number of arguments")
	end if
	
	password = cryptolib.decipher(encdata[0], encdata[1])
	
	save_to_dictionary(password)
	return password
end function

_crypto_decipher_file = function(self, file)
	if not file then exit("Error: File doesn't exist")
	if not file.has_permission("r") then exit("Error: Permission denied")
	if file.content.len == 0 then exit("Error: File is empty")
	
	DecryptedInfo = {}
	entries = file.content.split(char(10))
	for entry in entries
		// happens for empty rows
		if entry == "" then continue
		encdata = entry.split(":")
		DecryptedInfo.push({"user": encdata[0], "password": self.decipher(encdata)})
	end for
	print("<color=#f0e44e>Deciphering " + file.path + "</color>")
	for entry in DecryptedInfo
		if not entry.key.password then 
			print("<color=#db3437>Error: Nothing found for user: " + encdata[0] + "...</color>")
		else
			print("<color=#f0e44e>" + entry.key.user + " => " + entry.key.password + "</color>")
		end if
	end for
end function

_crypto_smtp_user_list = function(self, ip, port)
	cryptolib = self.dependencies.get_dependency()
	print("<color=#f0e44e>Connecting...</color>")
	Emails = {}
	Emails.found = []
	Emails.notfound = []
	if ip then
		if port then 
			mailinfo = cryptolib.smtp_user_list(ip, port.to_int)
		else
			mailinfo = cryptolib.smtp_user_list(ip, 25)
		end if
		// not a list, its an invalid target service string
		if typeof(mailinfo) == "string" then 
			print("<color=#db3437>Error: " + mailinfo + "</color>")
			return false
		end if
		
		print("<color=#f0e44e>Looking for email addresses...</color>")
		for email in mailinfo
			user = email[0:email.indexOf(" ")]
			email_info = email[email.indexOf(" "):]
			if email.indexOf("email not found") then
				Emails.notfound.push({"user":user, "email":email_info.trim})
			else
				Emails.found.push({"user":user, "email":email_info.trim})
			end if
		end for
		
		print("<color=#f0e44e>Found the following " + (Emails.found.len + Emails.notfound.len) + " user(s)</color>")
		if Emails.found.len > 0 then		
			for account in Emails.found
				print("<color=#f0e44e>" + account.user + " => " + account.email)
			end for
		end if
		
		if Emails.notfound.len > 0 then
			for account in Emails.notfound
				print("<color=#f0e44e>" + account.user + " => " + account.email)
			end for
		end if
	else
		print("<color=#db3437>Error: No ip address supplied</color>")
		return false
	end if	
end function

lib_crypto = {"dependencies": {"crypto": false, "get_dependency": @_crypto_get_dependency }, "decipher": @_crypto_decipher, "decipher_file": @_crypto_decipher_file, "smtp_dump": @_crypto_smtp_user_list, "classID":"CryptoLib 1.0.0"}
