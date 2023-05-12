*AuthRegisterV1 assumptions*

1. Password:
  According to Iteration 1 interface, a valid password is a string with six or more characters. Our group
  has decided to keep the restrictions according to the specifications provided. Therefore, passwords such
  as '      ' containing six white spaces and '@@!@$%^' containing six special characters are acceptable forms of a valid password.

2. First name and last name:
  Iteration 1 specifies that a valid first name and last name be a string from 1 to 50 characters inclusive. 
  This allows users to input ' E t^h aN' as a valid name as an example. However, according to the specifications, 
  a HandleStr is generated from the concatenation of both first and last name, the removal of white space and special characters 
  and allowing only lowercase alphanumeric numbers. This can cause a slight issue for HandlrStr if e.g both names consist of ONLY 
  special characters ' ^-..'. HandleStr will just return an empty string - to tackle the problem, our team has decided to restrict 
  both names to have at least ONE alphanumeric character in their name so HandleStr can return more than an empty string.

3. Once a user registers, the user will be automatically logged in. Hence for testing, once AuthRegisterV1 is called, 
  there is no need for AuthLoginV1 to be called and other functions can be called by the user. 

*Channel assumptions*

4. For channelsListAllV1, if there are no channels, return an empty array. 

5. If the index start in channelMessagesV1 is a negative number (<0), return error. Since starting from 0 accesses the first element (0) 
  in the returned array of messages, it wouldn't make sense for start to be <0. Hence, the index start has to start from 0 onwards.

6. A user who creates a channel becomes the channelOwner of that channel (the spec says user automatically joins channel only, so we 
  assume that the user becomes the channelOwner)

---------------------------------------------------------------------------------------------------------------------------------------------------------------
7. Global owners are not a part of ownerMembers (a key in the returning object for channelDetailsV1) in every channel they are in, unless added as a ownerMember by the channelOwner or themselves.
