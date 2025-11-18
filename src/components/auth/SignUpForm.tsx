import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Checkbox from "../form/input/Checkbox";
import { toast } from "react-toastify";
import { register } from "../../api/authService";

export default function SignUpForm() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    fname: "",
    lname: "",
    email: "",
    username: "",
    password: "",
  });
  const [errors, setErrors] = useState({
    fname: "",
    lname: "",
    email: "",
    username: "",
    password: "",
    general: "",
  });
  return (
    <div className="flex flex-col flex-1 w-full overflow-y-auto lg:w-1/2 no-scrollbar">
    
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Đăng ký
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Tạo tài khoản để sử dụng Ứng dụng Quản lý Sinh viên dành cho Sinh viên và Giảng viên.
            </p>
          </div>
          <div>
            
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setErrors({ fname: "", lname: "", email: "", username: "", password: "", general: "" });

                // Client-side validation
                const nextErrors: any = { fname: "", lname: "", email: "", username: "", password: "", general: "" };
                let hasError = false;

                if (!formData.fname.trim()) {
                  nextErrors.fname = "Tên là bắt buộc";
                  hasError = true;
                }
                if (!formData.lname.trim()) {
                  nextErrors.lname = "Họ là bắt buộc";
                  hasError = true;
                }
                if (!formData.username.trim()) {
                  nextErrors.username = "Tên đăng nhập là bắt buộc";
                  hasError = true;
                } else if (formData.username.length < 3 || formData.username.length > 50) {
                  nextErrors.username = "Tên đăng nhập phải dài từ 3 đến 50 ký tự";
                  hasError = true;
                }

                const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!formData.email.trim()) {
                  nextErrors.email = "Email là bắt buộc";
                  hasError = true;
                } else if (!emailRe.test(formData.email)) {
                  nextErrors.email = "Email không hợp lệ";
                  hasError = true;
                }

                if (!formData.password) {
                  nextErrors.password = "Mật khẩu là bắt buộc";
                  hasError = true;
                } else if (formData.password.length < 6) {
                  nextErrors.password = "Mật khẩu phải có ít nhất 6 ký tự";
                  hasError = true;
                }

                if (hasError) {
                  setErrors(nextErrors);
                  return;
                }

                setIsLoading(true);
                try {
                  const payload = {
                    firstName: formData.fname,
                    lastName: formData.lname,
                    email: formData.email,
                    username: formData.username,
                    password: formData.password,
                  };

                  const resp = await register(payload);
                  if (resp && (resp.code === 0 || (resp.httpStatus && resp.httpStatus >= 200 && resp.httpStatus < 300))) {
                    toast.success("Tạo tài khoản thành công. Vui lòng đăng nhập.");
                    navigate('/signin');
                  } else {
                    const msg = resp?.message || 'Không thể tạo tài khoản';
                    setErrors((p) => ({ ...p, general: msg }));
                    toast.error(msg);
                  }
                } catch (err: any) {
                  const msg = err?.message || 'Đăng ký thất bại';
                  setErrors((p) => ({ ...p, general: msg }));
                  toast.error(msg);
                } finally {
                  setIsLoading(false);
                }
              }}
            >
              <div className="space-y-5">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {/* <!-- First Name --> */}
                  <div className="sm:col-span-1">
                    <Label>
                      Tên<span className="text-error-500">*</span>
                    </Label>
                      <Input
                        type="text"
                        id="fname"
                        name="fname"
                        placeholder="Enter your first name"
                        value={formData.fname}
                        onChange={(e) => setFormData({ ...formData, fname: e.target.value })}
                        disabled={isLoading}
                      />
                      {errors.fname && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.fname}</p>}
                  </div>
                  {/* <!-- Last Name --> */}
                  <div className="sm:col-span-1">
                    <Label>
                      Họ<span className="text-error-500">*</span>
                    </Label>
                      <Input
                        type="text"
                        id="lname"
                        name="lname"
                        placeholder="Enter your last name"
                        value={formData.lname}
                        onChange={(e) => setFormData({ ...formData, lname: e.target.value })}
                        disabled={isLoading}
                      />
                      {errors.lname && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.lname}</p>}
                  </div>
                </div>
                {/* <!-- Username --> */}
                <div>
                  <Label>
                    Tên đăng nhập<span className="text-error-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    id="username"
                    name="username"
                    placeholder="Nhập tên đăng nhập"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    disabled={isLoading}
                  />
                  {errors.username && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.username}</p>}
                </div>

                {/* <!-- Email --> */}
                <div>
                  <Label>
                    Email<span className="text-error-500">*</span>
                  </Label>
                  <Input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="Nhập email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={isLoading}
                  />
                  {errors.email && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.email}</p>}
                </div>
                {/* <!-- Password --> */}
                <div>
                  <Label>
                    Mật khẩu<span className="text-error-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      placeholder="Nhập mật khẩu"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      disabled={isLoading}
                    />
                    {errors.password && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.password}</p>}
                    <span
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    >
                      {showPassword ? (
                        <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      ) : (
                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      )}
                    </span>
                    </div>
                </div>
                {/* <!-- Checkbox --> */}
                <div className="flex items-center gap-3">
                  <Checkbox
                    className="w-5 h-5"
                    checked={isChecked}
                    onChange={setIsChecked}
                  />
                  <p className="inline-block font-normal text-gray-500 dark:text-gray-400">
                    Bằng cách tạo tài khoản, bạn đồng ý với <span className="text-gray-800 dark:text-white/90">Điều khoản sử dụng</span> và <span className="text-gray-800 dark:text-white">Chính sách bảo mật</span> của chúng tôi.
                  </p>
                </div>
                {/* <!-- Button --> */}
                <div>
                  <button
                    type="submit"
                    className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-brand-500 shadow-theme-xs hover:bg-brand-600"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Đang đăng ký...' : 'Đăng ký'}
                  </button>
                  {errors.general && (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.general}</p>
                  )}
                </div>
              </div>
            </form>

            <div className="mt-5">
              <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
                Đã có tài khoản? {""}
                <Link
                  to="/signin"
                  className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                >
                  Đăng nhập
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
