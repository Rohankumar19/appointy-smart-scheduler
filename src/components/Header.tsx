import { useAppointments } from "@/contexts/AppointmentContext";
import { User } from "@/types/user";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Menu, PlusSquare, UserCircle } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
const Header = () => {
  const {
    users,
    currentUser,
    setCurrentUser
  } = useAppointments();
  const handleUserChange = (user: User | null) => {
    setCurrentUser(user);
  };
  return <header className="sticky top-0 z-10 flex h-16 w-full items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 md:px-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
        <div className="flex items-center gap-2">
          <Calendar className="h-6 w-6 text-appointy-purple" />
          <h1 className="text-lg font-semibold">Appointy</h1>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" className="hidden md:flex gap-1">
          <PlusSquare className="h-4 w-4 mr-1" />
          New Appointment
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            {currentUser ? <Avatar className="cursor-pointer">
                <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
                <AvatarFallback>{currentUser.name.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar> : <Button variant="ghost" size="icon">
                <UserCircle className="h-5 w-5" />
                <span className="sr-only">User menu</span>
              </Button>}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {currentUser && <>
                <DropdownMenuLabel>Signed in as {currentUser.name}</DropdownMenuLabel>
                <DropdownMenuSeparator />
              </>}
            <DropdownMenuLabel>Switch User</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {users.map(user => <DropdownMenuItem key={user.id} onClick={() => handleUserChange(user)}>
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback>{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.role}</p>
                  </div>
                </div>
              </DropdownMenuItem>)}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleUserChange(null)}>
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>;
};
export default Header;