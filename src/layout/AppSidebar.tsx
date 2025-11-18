import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router";

// Assume these icons are imported from an icon library
import {
  ChevronDownIcon,
  GridIcon,
  HorizontaLDots,
} from "../icons";
import {
  CoursesIcon,
  EnrollmentsIcon,
  GradeItemsIcon,
  RolesIcon,
  StudentGradesIcon,
  SubmissionFilesIcon,
  UsersIcon,
} from "../icons";
import { ClassesIcon, SubjectsIcon, AssignmentsIcon, TeacherClassesIcon, TeacherSubjectsIcon, TeacherAssignmentsIcon } from "../icons";
import { useSidebar } from "../context/SidebarContext";
import { Role } from "../types";
import useAuthStore from "../stores/useAuthStore";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  allowedRoles?: Role[]; 
  subItems?: {
    name: string;
    path: string;
    pro?: boolean;
    new?: boolean;
    allowedRoles?: Role[];
  }[];
};

const navItems: NavItem[] = [
  {
    icon: <GridIcon />,
    name: "Dashboard",
    path: "/",
  },
  {
    name: "Courses",
    icon: <CoursesIcon />,
    path: "/admin/courses",
    allowedRoles: ["ADMIN"],
  },
  {
    name: "Users",
    icon: <UsersIcon />,
    path: "/admin/users",
    allowedRoles: ["ADMIN"],
  },
  {
    name: "Roles",
    icon: <RolesIcon />,
    path: "/admin/roles",
    allowedRoles: ["ADMIN"],
  },
  {
    name: "Enrollments",
    icon: <EnrollmentsIcon />,
    path: "/admin/enrollments",
    allowedRoles: ["ADMIN"],
  },
  {
    name: "Grade Items",
    icon: <GradeItemsIcon />,
    path: "/admin/grade-items",
    allowedRoles: ["ADMIN"],
  },
  {
    name: "Student Grades",
    icon: <StudentGradesIcon />,
    path: "/admin/student-grades",
    allowedRoles: ["ADMIN"],
  },
  {
    name: "Submission Files",
    icon: <SubmissionFilesIcon />,
    path: "/admin/submission-files",
    allowedRoles: ["ADMIN"],
  },
  {
    name: "Classes",
    icon: <ClassesIcon />,
    path: "/student/classes",
    allowedRoles: ["STUDENT"],
  },
  {
    name: "Subjects",
    icon: <SubjectsIcon />,
    path: "/student/subjects",
    allowedRoles: ["STUDENT"],
  },
  {
    name: "Assignments",
    icon: <AssignmentsIcon />,
    path: "/student/assignments",
    allowedRoles: ["STUDENT"],
  },
  // Teacher top-level items
  {
    name: "Classes",
    icon: <TeacherClassesIcon />,
    path: "/teacher/classes",
    allowedRoles: ["TEACHER"],
  },
  {
    name: "Subjects",
    icon: <TeacherSubjectsIcon />,
    path: "/teacher/subjects",
    allowedRoles: ["TEACHER"],
  },
  {
    name: "Assignments",
    icon: <TeacherAssignmentsIcon />,
    path: "/teacher/assignments",
    allowedRoles: ["TEACHER"],
  },
];
 
const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const location = useLocation();
  const { user } = useAuthStore();
  const role = user?.roleName as Role | undefined;

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "others";
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
    {}
  );
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // const isActive = (path: string) => location.pathname === path;
  const isActive = useCallback(
    (path: string) => location.pathname === path,
    [location.pathname]
  );

  const canView = useCallback(
    (currentRole: Role | undefined, allowed?: Role[]) => {
      if (!allowed || allowed.length === 0) return true;
      if (!currentRole) return false;
      return allowed.includes(currentRole);
    },
    []
  );

  const filterMenuItems = useCallback(
    (items: NavItem[], currentRole: Role | undefined): NavItem[] => {
      return items
        .filter((item) => canView(currentRole, item.allowedRoles))
        .map((item) => {
          if (item.subItems) {
            const visibleSubs = item.subItems.filter((si) =>
              canView(currentRole, si.allowedRoles)
            );
            return { ...item, subItems: visibleSubs } as NavItem;
          }
          return item;
        })
        .filter((item) => !item.subItems || item.subItems.length > 0);
    },
    [canView]
  );

  const filteredMainItems = useMemo(() => filterMenuItems(navItems, role), [role, filterMenuItems]);

  // Group filtered items by target role and common items
  const commonItems = useMemo(
    () => filteredMainItems.filter((it) => !it.allowedRoles || it.allowedRoles.length === 0),
    [filteredMainItems]
  );
  const adminItems = useMemo(
    () =>
      filteredMainItems.filter(
        (it) =>
          (it.allowedRoles && it.allowedRoles.includes("ADMIN")) ||
          (it.subItems && it.subItems.some((si) => si.allowedRoles && si.allowedRoles.includes("ADMIN")))
      ),
    [filteredMainItems]
  );
  const teacherItems = useMemo(
    () =>
      filteredMainItems.filter(
        (it) =>
          (it.allowedRoles && it.allowedRoles.includes("TEACHER")) ||
          (it.subItems && it.subItems.some((si) => si.allowedRoles && si.allowedRoles.includes("TEACHER")))
      ),
    [filteredMainItems]
  );
  const studentItems = useMemo(
    () =>
      filteredMainItems.filter(
        (it) =>
          (it.allowedRoles && it.allowedRoles.includes("STUDENT")) ||
          (it.subItems && it.subItems.some((si) => si.allowedRoles && si.allowedRoles.includes("STUDENT")))
      ),
    [filteredMainItems]
  );

  useEffect(() => {
    let submenuMatched = false;
    // Only check main menu items for active sub-routes
    filteredMainItems.forEach((nav, index) => {
      if (nav.subItems) {
        nav.subItems.forEach((subItem) => {
          if (isActive(subItem.path)) {
            setOpenSubmenu({
              type: "main",
              index,
            });
            submenuMatched = true;
          }
        });
      }
    });

    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
  }, [location, isActive, filteredMainItems]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.type === menuType &&
        prevOpenSubmenu.index === index
      ) {
        return null;
      }
      return { type: menuType, index };
    });
  };

  const renderMenuItems = (items: NavItem[], menuType: "main" | "others") => (
    <ul className="flex flex-col gap-4">
      {items.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={`menu-item group ${
                openSubmenu?.type === menuType && openSubmenu?.index === index
                  ? "menu-item-active"
                  : "menu-item-inactive"
              } cursor-pointer ${
                !isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "lg:justify-start"
              }`}
            >
              <span
                className={`menu-item-icon-size  ${
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? "menu-item-icon-active"
                    : "menu-item-icon-inactive"
                }`}
              >
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className="menu-item-text">{nav.name}</span>
              )}
              {(isExpanded || isHovered || isMobileOpen) && (
                <ChevronDownIcon
                  className={`ml-auto w-5 h-5 transition-transform duration-200 ${
                    openSubmenu?.type === menuType &&
                    openSubmenu?.index === index
                      ? "rotate-180 text-brand-500"
                      : ""
                  }`}
                />
              )}
            </button>
          ) : (
            nav.path && (
              <Link
                to={nav.path}
                className={`menu-item group ${
                  isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                }`}
              >
                <span
                  className={`menu-item-icon-size ${
                    isActive(nav.path)
                      ? "menu-item-icon-active"
                      : "menu-item-icon-inactive"
                  }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="menu-item-text">{nav.name}</span>
                )}
              </Link>
            )
          )}
          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => {
                subMenuRefs.current[`${menuType}-${index}`] = el;
              }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height:
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? `${subMenuHeight[`${menuType}-${index}`]}px`
                    : "0px",
              }}
            >
              <ul className="mt-2 space-y-1 ml-9">
                {nav.subItems.map((subItem) => (
                  <li key={subItem.name}>
                    <Link
                      to={subItem.path}
                      className={`menu-dropdown-item ${
                        isActive(subItem.path)
                          ? "menu-dropdown-item-active"
                          : "menu-dropdown-item-inactive"
                      }`}
                    >
                      {subItem.name}
                      <span className="flex items-center gap-1 ml-auto">
                        {subItem.new && (
                          <span
                            className={`ml-auto ${
                              isActive(subItem.path)
                                ? "menu-dropdown-badge-active"
                                : "menu-dropdown-badge-inactive"
                            } menu-dropdown-badge`}
                          >
                            new
                          </span>
                        )}
                        {subItem.pro && (
                          <span
                            className={`ml-auto ${
                              isActive(subItem.path)
                                ? "menu-dropdown-badge-active"
                                : "menu-dropdown-badge-inactive"
                            } menu-dropdown-badge`}
                          >
                            pro
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${
          isExpanded || isMobileOpen
            ? "w-[290px]"
            : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-8 flex ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
        }`}
      >
        <Link to="/">
          {isExpanded || isHovered || isMobileOpen ? (
            <>
              <img
                className="dark:hidden"
                src="/images/logo/logo.svg"
                alt="Logo"
                width={150}
                height={40}
              />
              <img
                className="hidden dark:block"
                src="/images/logo/logo-dark.svg"
                alt="Logo"
                width={150}
                height={40}
              />
            </>
          ) : (
            <img
              src="/images/logo/logo-icon.svg"
              alt="Logo"
              width={32}
              height={32}
            />
          )}
        </Link>
      </div>
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            {/* Common / general items (visible to all) */}
            {commonItems.length > 0 && (
              <div>
                <h2
                  className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                    !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
                  }`}
                >
                  {isExpanded || isHovered || isMobileOpen ? "General" : <HorizontaLDots className="size-6" />}
                </h2>
                {renderMenuItems(commonItems, "main")}
              </div>
            )}

            {/* Admin section */}
            {role === "ADMIN" && adminItems.length > 0 && (
              <div>
                <h2
                  className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                    !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
                  }`}
                >
                  {isExpanded || isHovered || isMobileOpen ? "Admin" : <HorizontaLDots className="size-6" />}
                </h2>
                {renderMenuItems(adminItems, "main")}
              </div>
            )}

            {/* Teacher section */}
            {role === "TEACHER" && teacherItems.length > 0 && (
              <div>
                <h2
                  className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                    !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
                  }`}
                >
                  {isExpanded || isHovered || isMobileOpen ? "Teacher" : <HorizontaLDots className="size-6" />}
                </h2>
                {renderMenuItems(teacherItems, "main")}
              </div>
            )}

            {/* Student section */}
            {role === "STUDENT" && studentItems.length > 0 && (
              <div>
                <h2
                  className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                    !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
                  }`}
                >
                  {isExpanded || isHovered || isMobileOpen ? "Student" : <HorizontaLDots className="size-6" />}
                </h2>
                {renderMenuItems(studentItems, "main")}
              </div>
            )}
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
