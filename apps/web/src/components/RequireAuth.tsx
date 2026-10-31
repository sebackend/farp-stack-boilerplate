import { Navigate } from "react-router";
import { useEffect } from "react";
import { useAppSelector } from "../store/hooks";
import type { ReactNode } from "react";
import { useAppDispatch } from "../store/hooks";
import { useMeQuery } from "../features/auth/authApi";
import { setUser } from "../features/auth/authSlice";

interface RequireAuthProps {
  children: ReactNode;
}

export default function RequireAuth({ children }: RequireAuthProps) {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const user = useAppSelector((s) => s.auth.user);
  const { data, isLoading, isFetching, isError } = useMeQuery(undefined, {
    skip: !isAuthenticated || !!user,
  });

  useEffect(() => {
    if (data) {
      dispatch(setUser(data));
    }
  }, [data, dispatch]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!user && (isLoading || isFetching)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <p className="text-sm text-gray-500">Verifying session...</p>
      </div>
    );
  }

  if (!user && isError) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
