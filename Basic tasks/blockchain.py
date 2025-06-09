import sympy
import random

#polynomial where the constant term is the secret
def generate_polynomial(secret, threshold):
    coeffs = [secret] + [random.randint(1, 999) for _ in range(threshold - 1)]
    coeffs.reverse()
    x = sympy.symbols('x')
    return sympy.Poly(coeffs, x)

# Get a share (x, y)
def create_share(polynomial, x_value):
    return (x_value, polynomial.eval(x_value))

#Lagrange interpolation to reconstruct the polynomial
def lagrange_interpolation(shares_list):
    x = sympy.symbols('x')
    total_poly = 0

    for i in range(len(shares_list)):
        xi, yi = shares_list[i]
        term = 1
        for j in range(len(shares_list)):
            xj, _ = shares_list[j]
            if i != j:
                term *= (x - xj) / (xi - xj)
        total_poly += yi * term

    return sympy.simplify(total_poly)

# Create secret shares
def split_secret():
    print("\n=== Secret Sharing: Split Secret ===")
    secret = int(input("Enter your secret number: "))
    threshold = int(input("Enter minimum shares needed to recover the secret (threshold): "))
    total_shares = int(input("Enter total number of shares to create: "))

    polynomial = generate_polynomial(secret, threshold)
    shares = [create_share(polynomial, i) for i in range(1, total_shares + 1)]

    print(f"\nGenerated Polynomial: f(x) = {polynomial.as_expr()}")
    print("\nShares to distribute:")
    for x, y in shares:
        print(f"Share {x}: ({x}, {y})")

    return shares

# Recover the secret
def recover_secret():
    print("\n=== Secret Sharing: Recover Secret ===")
    num_given_shares = int(input("Enter number of shares you have: "))
    shares_list = []

    for _ in range(num_given_shares):
        x, y = map(int, input("Enter share as x,y: ").split(','))
        shares_list.append((x, y))

    recovered_poly = lagrange_interpolation(shares_list)
    secret = recovered_poly.subs(sympy.symbols('x'), 0)

    print(f"\nReconstructed Polynomial: f(x) = {recovered_poly}")
    print(f"Recovered Secret: {int(secret)}")
    return secret

#menu
def main():
    while True:
        print("\n--- Shamir's Secret Sharing---")
        print("1. Split a secret")
        print("2. Recover a secret")
        print("3. Exit")

        choice = input("Choose an option (1/2/3): ").strip()
        if choice == '1':
            split_secret()
        elif choice == '2':
            recover_secret()
        elif choice == '3':
            print("Exiting...")
            break
        else:
            print("Invalid choice. Try again.")

if __name__ == "__main__":
    main()
